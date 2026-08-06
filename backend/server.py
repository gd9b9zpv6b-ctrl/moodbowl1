from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import jwt as pyjwt
from jwt import PyJWKClient

from push_service import send_push, register_device
from email_service import send_password_reset_otp, send_invite_code as send_invite_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
JWT_SECRET = os.environ.get('JWT_SECRET', 'moodful-healing-secret-key-change-me')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_DAYS = 30
ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', 'testuser1@example.com').split(',') if e.strip()}
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
SUPABASE_ISSUER = f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else ""
SUPABASE_JWKS = (
    PyJWKClient(f"{SUPABASE_ISSUER}/.well-known/jwks.json", cache_keys=True)
    if SUPABASE_ISSUER and not SUPABASE_JWT_SECRET
    else None
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============ Helpers ============
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(p: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(p, hashed)
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_supabase_token(token: str) -> dict:
    if not SUPABASE_ISSUER:
        raise ValueError("SUPABASE_URL is not configured")

    try:
        if SUPABASE_JWT_SECRET:
            key = SUPABASE_JWT_SECRET
            algorithms = ["HS256"]
        else:
            if not SUPABASE_JWKS:
                raise ValueError("Supabase JWKS is not configured")
            key = SUPABASE_JWKS.get_signing_key_from_jwt(token).key
            algorithms = ["ES256", "RS256"]
        return pyjwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience="authenticated",
            issuer=SUPABASE_ISSUER,
        )
    except Exception as exc:
        raise ValueError("Invalid Supabase token") from exc


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = creds.credentials
    user_id: Optional[str] = None
    supabase_claims: Optional[dict] = None

    # Keep old invite-code sessions alive until that workflow moves in Phase 4.
    try:
        legacy_payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = legacy_payload.get("sub")
    except JWTError:
        try:
            supabase_claims = decode_supabase_token(token)
            user_id = supabase_claims.get("sub")
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    if supabase_claims:
        email = (supabase_claims.get("email") or "").lower()
        user = await db.users.find_one(
            {"$or": [{"supabase_user_id": user_id}, {"id": user_id}]},
            {"_id": 0, "hashed_password": 0},
        )
        if not user and email:
            user = await db.users.find_one(
                {"email": email},
                {"_id": 0, "hashed_password": 0},
            )
            if user:
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"supabase_user_id": user_id}},
                )
                user["supabase_user_id"] = user_id

        if not user:
            metadata = supabase_claims.get("user_metadata") or {}
            user = {
                "id": user_id,
                "supabase_user_id": user_id,
                "email": email,
                "display_name": metadata.get("display_name") or email.split("@")[0],
                "created_at": now_iso(),
                "credits": 0,
                "is_premium": False,
                "secret_pin_hash": None,
                "diary_style": {},
                "active_icon_pack": "classic",
                "role": "student",
            }
            await db.users.insert_one(user.copy())
            user.pop("_id", None)
        return user

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ============ Models ============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    display_name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    display_name: Optional[str] = None
    created_at: str
    credits: int = 0
    is_premium: bool = False
    is_admin: bool = False
    has_secret_pin: bool = False
    diary_style: dict = Field(default_factory=dict)
    active_icon_pack: str = "classic"
    featured_by_date: dict = Field(default_factory=dict)
    role: str = "student"  # student | teacher | parent | counsellor | school_admin


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def _user_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        display_name=u.get("display_name"),
        created_at=u["created_at"],
        credits=u.get("credits", 0),
        is_premium=u.get("is_premium", False),
        is_admin=u["email"].lower() in ADMIN_EMAILS,
        has_secret_pin=bool(u.get("secret_pin_hash")),
        diary_style=u.get("diary_style", {}),
        active_icon_pack=u.get("active_icon_pack", "classic"),
        featured_by_date=u.get("featured_by_date", {}),
        role=u.get("role", "student"),
    )


class EntryIn(BaseModel):
    emotion: Optional[str] = None            # legacy single-emotion field
    emotions: Optional[List[str]] = None     # new multi-select list
    note: str = ""
    is_public: bool = False
    is_secret: bool = False
    energy_level: Optional[int] = None       # 0-100 battery slider (dual-track w/ emotion)
    entry_date: str  # YYYY-MM-DD


class EntryUpdate(BaseModel):
    emotion: Optional[str] = None
    emotions: Optional[List[str]] = None
    note: Optional[str] = None
    is_public: Optional[bool] = None
    is_secret: Optional[bool] = None
    energy_level: Optional[int] = None


class EntryOut(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    emotion: str                             # primary emotion (first of list)
    emotions: List[str] = Field(default_factory=list)
    note: str
    is_public: bool
    is_secret: bool = False
    energy_level: Optional[int] = None
    entry_date: str
    created_at: str
    hearts: int = 0
    hearted_by_me: bool = False
    # NEW: which community the entry belongs to (auto-set from author's role at post time)
    community_scope: str = "student"          # 'student' | 'adult'
    author_role: str = "student"              # snapshot of role at post time
    author_role_label: Optional[str] = None   # 班主任 · 家長 · etc — for display in adult community


class TaskIn(BaseModel):
    title: str
    task_date: str  # YYYY-MM-DD


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None


class TaskOut(BaseModel):
    id: str
    user_id: str
    title: str
    completed: bool
    task_date: str
    created_at: str


class MemoryIn(BaseModel):
    prompt_key: str
    prompt_text: str
    stage: str  # childhood / teen / young-adult / adult / reflection
    response: str


class MemoryOut(BaseModel):
    id: str
    user_id: str
    prompt_key: str
    prompt_text: str
    stage: str
    response: str
    created_at: str


# ============ Auth Routes ============
@api_router.post("/auth/register", response_model=AuthOut)
async def register(data: RegisterIn):
    email_lower = data.email.lower()
    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    display_name = data.display_name or email_lower.split("@")[0]
    created_at = now_iso()
    user_doc = {
        "id": user_id,
        "email": email_lower,
        "display_name": display_name,
        "hashed_password": hash_password(data.password),
        "created_at": created_at,
        "credits": 0,
        "is_premium": True,
        "secret_pin_hash": None,
        "diary_style": {},
        "active_icon_pack": "classic",
        "role": "student",
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id)
    return AuthOut(access_token=token, user=_user_to_out(user_doc))


@api_router.post("/auth/login", response_model=AuthOut)
async def login(data: LoginIn):
    email_lower = data.email.lower()
    user = await db.users.find_one({"email": email_lower})
    if not user or not user.get("hashed_password") or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(user["id"])
    return AuthOut(access_token=token, user=_user_to_out(user))


@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return _user_to_out(current)


# Role labels shown in adult community
ROLE_LABELS = {
    "student": "學生",
    "teacher": "班主任",
    "counsellor": "輔導老師",
    "parent": "家長",
    "school_admin": "校方",
}

# Which roles post into which community
def community_scope_for(role: str) -> str:
    return "student" if role == "student" else "adult"


# ============ Entry Routes ============
async def _entries_with_hearts(cursor_docs: List[dict], user_id: str) -> List[EntryOut]:
    entry_ids = [d["id"] for d in cursor_docs]
    hearts_map: dict[str, int] = {}
    my_hearts: set[str] = set()
    if entry_ids:
        pipeline = [
            {"$match": {"entry_id": {"$in": entry_ids}}},
            {"$group": {"_id": "$entry_id", "count": {"$sum": 1}}},
        ]
        async for row in db.reactions.aggregate(pipeline):
            hearts_map[row["_id"]] = row["count"]
        async for r in db.reactions.find(
            {"entry_id": {"$in": entry_ids}, "user_id": user_id}, {"_id": 0, "entry_id": 1}
        ):
            my_hearts.add(r["entry_id"])
    return [
        EntryOut(
            id=d["id"],
            user_id=d["user_id"],
            display_name=d.get("display_name"),
            emotion=d["emotion"],
            emotions=d.get("emotions") or ([d["emotion"]] if d.get("emotion") else []),
            note=d.get("note", ""),
            is_public=d.get("is_public", False),
            is_secret=d.get("is_secret", False),
            energy_level=d.get("energy_level"),
            entry_date=d["entry_date"],
            created_at=d["created_at"],
            hearts=hearts_map.get(d["id"], 0),
            hearted_by_me=d["id"] in my_hearts,
            community_scope=d.get("community_scope", "student"),
            author_role=d.get("author_role", "student"),
            author_role_label=d.get("author_role_label"),
        )
        for d in cursor_docs
    ]


@api_router.post("/entries", response_model=EntryOut)
async def create_entry(data: EntryIn, current=Depends(get_current_user)):
    entry_id = str(uuid.uuid4())
    # Normalize emotions list
    emotions_list = data.emotions or ([data.emotion] if data.emotion else [])
    if not emotions_list:
        raise HTTPException(status_code=400, detail="At least one emotion is required")
    primary = emotions_list[0]
    # secret entries are always private
    is_public = data.is_public and not data.is_secret
    author_role = current.get("role", "student")

    # Community content policy — reject PUBLIC posts that contain banned keywords.
    # Diary/private is intentionally unfiltered — users can freely vent about anything.
    if is_public:
        note_text = (data.note or "")
        cfg = await get_school_config()
        ban_list = cfg.get("post_ban_keywords") or []
        matched_ban = [kw for kw in ban_list if kw and kw in note_text]
        matched_crisis_in_post: List[str] = []
        if cfg.get("block_crisis_in_posts", True):
            diary_list = cfg.get("diary_keywords") or []
            matched_crisis_in_post = [kw for kw in diary_list if kw and kw in note_text]
        if matched_ban or matched_crisis_in_post:
            # Even though the post is blocked · we STILL log an alert for the counsellor.
            # Attempts to post aggressive / crisis content are safety signals worth reviewing.
            await _log_blocked_post_alert(
                author=current,
                note_text=note_text,
                matched_ban=matched_ban,
                matched_crisis=matched_crisis_in_post,
                entry_date=data.entry_date,
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "post_content_blocked",
                    "message": "呢個 post 含唔可以公開嘅字眼。你可以改字後再出 · 或者關咗 Share 淨係寫落私人日記。",
                    "matched_ban": matched_ban,
                    "matched_crisis": matched_crisis_in_post,
                },
            )

    doc = {
        "id": entry_id,
        "user_id": current["id"],
        "display_name": current.get("display_name"),
        "emotion": primary,
        "emotions": emotions_list,
        "note": data.note,
        "is_public": is_public,
        "is_secret": data.is_secret,
        "energy_level": data.energy_level,
        "entry_date": data.entry_date,
        "created_at": now_iso(),
        "author_role": author_role,
        "author_role_label": ROLE_LABELS.get(author_role, author_role),
        "community_scope": community_scope_for(author_role),
    }
    await db.entries.insert_one(doc)
    # Fire-and-forget keyword safety scan (never blocks the response)
    await _check_and_create_alert(doc, current)
    return EntryOut(
        **{k: v for k, v in doc.items() if k != "_id"},
        hearts=0,
        hearted_by_me=False,
    )


@api_router.get("/entries", response_model=List[EntryOut])
async def list_my_entries(current=Depends(get_current_user)):
    docs = await db.entries.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return await _entries_with_hearts(docs, current["id"])


@api_router.get("/entries/calendar", response_model=List[EntryOut])
async def calendar_entries(month: str, current=Depends(get_current_user)):
    # month = YYYY-MM
    docs = await db.entries.find(
        {"user_id": current["id"], "entry_date": {"$regex": f"^{month}"}}, {"_id": 0}
    ).sort("entry_date", 1).to_list(200)
    return await _entries_with_hearts(docs, current["id"])


# How many days a public community post stays visible (server-side default).
# Frontend school-admin can configure this per school; we honor a query override.
DEFAULT_COMMUNITY_TTL_DAYS = 30


@api_router.get("/entries/community", response_model=List[EntryOut])
async def community_entries(
    scope: Optional[str] = None,
    ttl_days: Optional[int] = None,
    current=Depends(get_current_user),
):
    """Community feed with strict role-based scope enforcement + optional TTL filter.
    HARD RULE: students can NEVER see adult community — enforced at API level.
    """
    user_role = current.get("role", "student")
    filters: dict = {"is_public": True}

    if user_role == "student":
        filters["community_scope"] = "student"
    else:
        if scope in ("student", "adult"):
            filters["community_scope"] = scope

    # TTL filter — hides posts older than N days from the feed (data still exists)
    ttl = ttl_days if ttl_days is not None else DEFAULT_COMMUNITY_TTL_DAYS
    if ttl and ttl > 0:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=ttl)).isoformat()
        filters["created_at"] = {"$gte": cutoff}

    docs = await db.entries.find(filters, {"_id": 0}).sort("created_at", -1).to_list(200)
    return await _entries_with_hearts(docs, current["id"])


@api_router.get("/admin/community-history", response_model=List[EntryOut])
async def community_history(
    scope: Optional[str] = None,
    limit: int = 100,
    current=Depends(get_current_user),
):
    """Admin-only endpoint — returns ALL public entries including expired ones.
    Useful for school_admin / counsellor to audit historical community posts."""
    user_role = current.get("role", "student")
    if user_role not in MODERATOR_ROLES:
        raise HTTPException(status_code=403, detail="Moderator role required")

    filters: dict = {"is_public": True}
    if scope in ("student", "adult"):
        filters["community_scope"] = scope

    docs = await db.entries.find(filters, {"_id": 0}).sort("created_at", -1).to_list(min(limit, 500))
    return await _entries_with_hearts(docs, current["id"])


# ============ Safety Alerts ============
@api_router.get("/alerts")
async def list_alerts(status_filter: Optional[str] = None, current=Depends(get_current_user)):
    """List keyword-triggered alerts.
    - school_admin · counsellor: see ALL alerts across the school
    - teacher: see only alerts for students in their own class (`class_name` match)
    - parent: see only alerts for their linked children · gated by the school-wide
      `notify_parents_on_alert` toggle (default OFF)
    - others: 403
    """
    user_role = current.get("role", "student")
    ALERT_VIEWERS = {"school_admin", "counsellor", "teacher", "parent"}
    if user_role not in ALERT_VIEWERS:
        raise HTTPException(status_code=403, detail="Not permitted to view alerts")

    filters: dict = {}
    if status_filter in ("open", "reviewed", "resolved"):
        filters["status"] = status_filter

    docs = await db.alerts.find(filters, {"_id": 0}).sort("created_at", -1).to_list(200)

    # Teacher class-scope filter
    if user_role == "teacher":
        my_class = current.get("class_name")
        if not my_class:
            return []  # teacher not assigned to any class · sees nothing
        # Fetch the class's students
        class_student_ids = {
            u["id"] async for u in db.users.find(
                {"role": "student", "class_name": my_class},
                {"_id": 0, "id": 1},
            )
        }
        docs = [d for d in docs if d.get("student_id") in class_student_ids]

    # Parent scope: gated by school-wide toggle + limited to linked children
    if user_role == "parent":
        cfg = await get_school_config()
        if not cfg.get("notify_parents_on_alert", False):
            return []  # school hasn't opted parents in — nothing to show
        # Linked children — students whose parent_email matches this parent
        my_email = (current.get("email") or "").lower()
        if not my_email:
            return []
        child_ids = {
            u["id"] async for u in db.users.find(
                {"role": "student", "parent_email": my_email},
                {"_id": 0, "id": 1},
            )
        }
        docs = [d for d in docs if d.get("student_id") in child_ids]

    # PRIVACY: strip `note_snippet` from every payload — the content is only revealed via
    # the explicit /alerts/{id}/reveal endpoint (school-admin toggle + audit-logged).
    for d in docs:
        d.pop("note_snippet", None)

    return docs


@api_router.patch("/alerts/{alert_id}")
async def update_alert(alert_id: str, current=Depends(get_current_user)):
    """Mark an alert as reviewed by the current moderator."""
    user_role = current.get("role", "student")
    if user_role not in {"school_admin", "counsellor", "teacher"}:
        raise HTTPException(status_code=403, detail="Not permitted")

    alert = await db.alerts.find_one({"id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "status": "reviewed",
            "reviewed_by": current.get("email"),
            "reviewed_at": now_iso(),
        }},
    )
    await _write_audit(
        action="alert_reviewed",
        actor=current,
        target_kind="alert",
        target_id=alert_id,
        meta={"student_id": alert.get("student_id"), "matched": alert.get("matched_keywords")},
    )
    doc = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    doc.pop("note_snippet", None)  # never leak content in default responses
    return doc


@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, current=Depends(get_current_user)):
    """Delete an alert entirely (hard delete). Counsellor + school_admin only.
    All deletions are audit-logged and cannot be undone."""
    user_role = current.get("role", "student")
    if user_role not in {"school_admin", "counsellor"}:
        raise HTTPException(status_code=403, detail="Only counsellor or school_admin can delete alerts")

    alert = await db.alerts.find_one({"id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await db.alerts.delete_one({"id": alert_id})
    await _write_audit(
        action="alert_deleted",
        actor=current,
        target_kind="alert",
        target_id=alert_id,
        meta={
            "student_id": alert.get("student_id"),
            "matched": alert.get("matched_keywords"),
            "source": alert.get("source"),
            "was_status": alert.get("status"),
        },
    )
    return {"deleted": True, "id": alert_id}


class NoteRevealRequest(BaseModel):
    """Audit-logged request from a counsellor to view an alert's original note.
    `consent_confirmed=True` is required — the frontend gates this behind a modal."""
    consent_confirmed: bool = False
    reason: Optional[str] = None


@api_router.post("/alerts/{alert_id}/reveal")
async def reveal_alert_content(
    alert_id: str,
    payload: NoteRevealRequest,
    current=Depends(get_current_user),
):
    """Counsellor requests to view the student's original note.
    Requires:
     - school-wide toggle `counsellor_can_view_note_content=True`
     - counsellor consent-confirmation (`consent_confirmed=True`)
    Every reveal is audit-logged with reason (if provided)."""
    if current.get("role") != "counsellor":
        raise HTTPException(status_code=403, detail="Only counsellors can request reveal")

    cfg = await get_school_config()
    if not cfg.get("counsellor_can_view_note_content", False):
        raise HTTPException(
            status_code=403,
            detail={"code": "reveal_not_permitted",
                    "message": "校方未開啟輔導查看內容權限 · 請聯絡 School Admin。"},
        )

    if not payload.consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail={"code": "consent_required",
                    "message": "請先確認已取得學生同意。"},
        )

    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # AUDIT: this is a privacy-sensitive action — the most-scrutinised entry in our log.
    await _write_audit(
        action="counsellor_revealed_note",
        actor=current,
        target_kind="alert",
        target_id=alert_id,
        meta={
            "student_id": alert.get("student_id"),
            "student_email": alert.get("student_email"),
            "reason": (payload.reason or "").strip()[:300],
            "matched": alert.get("matched_keywords"),
            "source": alert.get("source"),
        },
    )
    return {
        "id": alert_id,
        "note_snippet": alert.get("note_snippet") or "(內容已冇儲存)",
        "matched_keywords": alert.get("matched_keywords") or [],
        "source": alert.get("source"),
        "revealed_at": now_iso(),
        "revealed_by": current.get("email"),
    }


# ==============================================================================
# School-wide content policy (admin-owned keyword lists + parent-notify toggle)
# ==============================================================================


class SchoolPolicyUpdate(BaseModel):
    diary_keywords: Optional[List[str]] = None
    post_ban_keywords: Optional[List[str]] = None
    block_crisis_in_posts: Optional[bool] = None
    notify_parents_on_alert: Optional[bool] = None
    counsellor_can_view_note_content: Optional[bool] = None


class FamilyCreate(BaseModel):
    """Payload for admin-created student + parent pair."""
    student_email: str
    student_name: str
    student_password: str
    student_class: Optional[str] = None
    parent_email: str
    parent_name: str
    parent_password: str


class NoteRevealRequest(BaseModel):  # noqa: F811 — declared above · kept here documentation-adjacent  # noqa
    """See earlier declaration used by /alerts/{id}/reveal."""
    consent_confirmed: bool = False
    reason: Optional[str] = None


def _clean_kw_list(items: Optional[List[str]]) -> List[str]:
    if not items:
        return []
    seen = set()
    out: List[str] = []
    for it in items:
        s = (it or "").strip()
        if not s:
            continue
        if s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out


@api_router.get("/admin/policies")
async def get_admin_policies(current=Depends(get_current_user)):
    """Read the school-wide content policy.
    Any adult role can READ (so students' local frontend can pre-flight validation) ·
    only school_admin can WRITE (see PUT below)."""
    # Everyone (including students) may read the policy — they need it to know why their post is blocked.
    cfg = await get_school_config()
    return {
        "diary_keywords": cfg.get("diary_keywords") or [],
        "post_ban_keywords": cfg.get("post_ban_keywords") or [],
        "block_crisis_in_posts": bool(cfg.get("block_crisis_in_posts", True)),
        "notify_parents_on_alert": bool(cfg.get("notify_parents_on_alert", False)),
        "counsellor_can_view_note_content": bool(cfg.get("counsellor_can_view_note_content", False)),
        "updated_at": cfg.get("updated_at"),
    }


@api_router.put("/admin/policies")
async def update_admin_policies(
    payload: SchoolPolicyUpdate,
    current=Depends(get_current_user),
):
    """Update school-wide content policy. Only school_admin can write."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin can edit policies")

    updates: dict = {"updated_at": now_iso()}
    if payload.diary_keywords is not None:
        cleaned = _clean_kw_list(payload.diary_keywords)
        updates["diary_keywords"] = cleaned
        await _write_audit(
            action="policy_diary_keywords_updated",
            actor=current, target_kind="school", target_id=SCHOOL_CONFIG_ID,
            meta={"count": len(cleaned)},
        )
    if payload.post_ban_keywords is not None:
        cleaned = _clean_kw_list(payload.post_ban_keywords)
        updates["post_ban_keywords"] = cleaned
        await _write_audit(
            action="policy_post_ban_updated",
            actor=current, target_kind="school", target_id=SCHOOL_CONFIG_ID,
            meta={"count": len(cleaned)},
        )
    if payload.block_crisis_in_posts is not None:
        updates["block_crisis_in_posts"] = bool(payload.block_crisis_in_posts)
    if payload.notify_parents_on_alert is not None:
        updates["notify_parents_on_alert"] = bool(payload.notify_parents_on_alert)
        await _write_audit(
            action="policy_notify_parents_toggle",
            actor=current, target_kind="school", target_id=SCHOOL_CONFIG_ID,
            meta={"enabled": bool(payload.notify_parents_on_alert)},
        )
    if payload.counsellor_can_view_note_content is not None:
        # Log the *policy change itself* — it authorises future privacy invasion.
        await _write_audit(
            action="policy_counsellor_view_toggle",
            actor=current,
            target_kind="school",
            target_id=SCHOOL_CONFIG_ID,
            meta={"enabled": bool(payload.counsellor_can_view_note_content)},
        )
        updates["counsellor_can_view_note_content"] = bool(payload.counsellor_can_view_note_content)

    # Ensure the doc exists
    await get_school_config()
    await db.school_config.update_one(
        {"id": SCHOOL_CONFIG_ID},
        {"$set": updates},
    )
    cfg = await get_school_config()
    return {
        "diary_keywords": cfg.get("diary_keywords") or [],
        "post_ban_keywords": cfg.get("post_ban_keywords") or [],
        "block_crisis_in_posts": bool(cfg.get("block_crisis_in_posts", True)),
        "notify_parents_on_alert": bool(cfg.get("notify_parents_on_alert", False)),
        "counsellor_can_view_note_content": bool(cfg.get("counsellor_can_view_note_content", False)),
        "updated_at": cfg.get("updated_at"),
    }


# ==============================================================================
# Admin — family (student ↔ parent) management
# ==============================================================================


@api_router.get("/admin/users")
async def list_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    current=Depends(get_current_user),
):
    """Admin-only user directory · used by the pairing form's autocomplete."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")
    filters: dict = {}
    if role:
        filters["role"] = role
    docs = await db.users.find(filters, {
        "_id": 0, "id": 1, "email": 1, "display_name": 1,
        "role": 1, "class_name": 1, "parent_email": 1,
        "parent_emails": 1, "child_emails": 1,
    }).sort("email", 1).to_list(500)
    if q:
        qq = q.lower()
        docs = [
            d for d in docs
            if qq in (d.get("email") or "").lower()
            or qq in (d.get("display_name") or "").lower()
        ]
    return docs[:50]


@api_router.post("/admin/families")
async def create_family(payload: FamilyCreate, current=Depends(get_current_user)):
    """Create a student + parent pair · idempotent on existing emails. Audit-logged."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")

    stu_email = payload.student_email.strip().lower()
    par_email = payload.parent_email.strip().lower()
    if not stu_email or not par_email:
        raise HTTPException(status_code=400, detail="Emails required")
    if stu_email == par_email:
        raise HTTPException(status_code=400, detail="Student and parent must have different emails")

    async def _ensure_user(email: str, name: str, password: str, role: str, class_name: Optional[str]) -> dict:
        existing = await db.users.find_one({"email": email})
        if existing:
            return existing
        doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "display_name": name,
            "hashed_password": hash_password(password),
            "created_at": now_iso(),
            "credits": 20,
            "is_premium": True,
            "secret_pin_hash": None,
            "diary_style": {},
            "active_icon_pack": "classic",
            "role": role,
            "class_name": class_name,
        }
        await db.users.insert_one(doc)
        return doc

    student = await _ensure_user(
        stu_email, payload.student_name.strip() or stu_email,
        payload.student_password, "student", (payload.student_class or "").strip() or None,
    )
    parent = await _ensure_user(
        par_email, payload.parent_name.strip() or par_email,
        payload.parent_password, "parent", None,
    )

    await db.users.update_one(
        {"id": student["id"]},
        {"$set": {"parent_email": par_email},
         "$addToSet": {"parent_emails": par_email}},
    )
    await db.users.update_one(
        {"id": parent["id"]},
        {"$addToSet": {"child_emails": stu_email}},
    )

    await _write_audit(
        action="family_created",
        actor=current,
        target_kind="family",
        target_id=f"{stu_email}<->{par_email}",
        meta={"student_email": stu_email, "parent_email": par_email,
              "class_name": student.get("class_name")},
    )

    return {
        "student": {"id": student["id"], "email": stu_email, "display_name": student.get("display_name")},
        "parent":  {"id": parent["id"],  "email": par_email, "display_name": parent.get("display_name")},
        "linked_at": now_iso(),
    }


class UnlinkFamily(BaseModel):
    student_email: str
    parent_email: str


@api_router.post("/admin/families/unlink")
async def unlink_family(payload: UnlinkFamily, current=Depends(get_current_user)):
    """Break the link between a student and one of their parents. Doesn't delete accounts."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")

    stu_email = payload.student_email.strip().lower()
    par_email = payload.parent_email.strip().lower()

    stu = await db.users.find_one({"email": stu_email, "role": "student"})
    if stu:
        updates: dict = {"$pull": {"parent_emails": par_email}}
        if (stu.get("parent_email") or "").lower() == par_email:
            updates["$set"] = {"parent_email": None}
        await db.users.update_one({"id": stu["id"]}, updates)

    await db.users.update_one(
        {"email": par_email, "role": "parent"},
        {"$pull": {"child_emails": stu_email}},
    )

    await _write_audit(
        action="family_unlinked",
        actor=current,
        target_kind="family",
        target_id=f"{stu_email}<->{par_email}",
        meta={"student_email": stu_email, "parent_email": par_email},
    )
    return {"unlinked": True}


# ==============================================================================
# Bulk student onboarding — CSV upload + invite codes for self-activation.
# Flow:
#  1. Admin uploads a list of (name · email · class) → we pre-create the accounts
#     WITHOUT a password · but with a random invite_code stored on the user doc.
#  2. Admin distributes the code (via school notice / email / paper) to each student.
#  3. Student opens the app · picks "用邀請碼註冊" · enters code + sets password.
#  4. Backend validates the code · sets password · clears the invite_code.
# ==============================================================================


import secrets


def _generate_invite_code(prefix: str = "S") -> str:
    """8-char alphanumeric · prefixed so admins can eyeball the type at a glance."""
    body = ''.join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8))
    return f"{prefix}-{body}"


class BulkStudentEntry(BaseModel):
    name: str
    email: str
    class_name: Optional[str] = None


class BulkStudentPayload(BaseModel):
    students: List[BulkStudentEntry]


@api_router.post("/admin/students/bulk")
async def bulk_create_students(payload: BulkStudentPayload, current=Depends(get_current_user)):
    """Bulk-create student accounts with unpaid invite codes. Idempotent on existing emails
    (returns their state but doesn't overwrite). Audit-logged."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")

    if not payload.students:
        raise HTTPException(status_code=400, detail="Empty student list")

    created: List[dict] = []
    already: List[dict] = []
    errors: List[dict] = []

    for entry in payload.students:
        email = (entry.email or "").strip().lower()
        name = (entry.name or "").strip()
        cls = (entry.class_name or "").strip() or None
        if not email or "@" not in email or not name:
            errors.append({"email": email, "reason": "Missing name or email"})
            continue

        existing = await db.users.find_one({"email": email}, {"_id": 0})
        if existing:
            already.append({
                "email": email,
                "display_name": existing.get("display_name"),
                "class_name": existing.get("class_name"),
                "activated": bool(existing.get("hashed_password")),
                "invite_code": existing.get("invite_code"),
            })
            continue

        code = _generate_invite_code("S")
        doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "display_name": name,
            # NO password set · invite code is the only way in until they activate
            "hashed_password": None,
            "invite_code": code,
            "invite_code_created_at": now_iso(),
            "created_at": now_iso(),
            "credits": 20,
            "is_premium": True,
            "secret_pin_hash": None,
            "diary_style": {},
            "active_icon_pack": "classic",
            "role": "student",
            "class_name": cls,
        }
        await db.users.insert_one(doc)
        # Best-effort · fire the invite email in the background · never fail the API
        try:
            school_name = None
            try:
                cfg = await get_school_config()
                school_name = cfg.get("school_name")
            except Exception:
                pass
            send_invite_email(
                to=email,
                display_name=name,
                invite_code=code,
                school_name=school_name,
                class_name=cls,
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("Invite email failed for %s · %s", email, e)
        created.append({
            "email": email,
            "display_name": name,
            "class_name": cls,
            "invite_code": code,
        })

    await _write_audit(
        action="students_bulk_created",
        actor=current,
        target_kind="school",
        target_id=SCHOOL_CONFIG_ID,
        meta={"created": len(created), "already": len(already), "errors": len(errors)},
    )
    return {"created": created, "already_existing": already, "errors": errors}


@api_router.get("/admin/invite-codes")
async def list_invite_codes(current=Depends(get_current_user)):
    """List all pending / used invite codes for admin distribution."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")
    docs = await db.users.find(
        {"invite_code": {"$exists": True, "$ne": None}},
        {"_id": 0, "email": 1, "display_name": 1, "class_name": 1, "role": 1,
         "invite_code": 1, "hashed_password": 1, "invite_code_created_at": 1},
    ).to_list(1000)
    for d in docs:
        d["activated"] = bool(d.pop("hashed_password", None))
    docs.sort(key=lambda x: x.get("invite_code_created_at") or "", reverse=True)
    return docs


class InviteActivate(BaseModel):
    invite_code: str
    password: str


@api_router.post("/auth/activate", response_model=AuthOut)
async def activate_by_invite(payload: InviteActivate):
    """Student/parent uses invite code + chooses a password to activate their pre-created account.
    On success, returns a JWT and clears the invite code (single-use)."""
    code = payload.invite_code.strip()
    if not code or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Invalid code or password too short")

    user = await db.users.find_one({"invite_code": code})
    if not user:
        raise HTTPException(status_code=404, detail="邀請碼無效 · 請 double check")
    if user.get("hashed_password"):
        raise HTTPException(status_code=409, detail="呢個帳戶已經啟用過 · 請直接用 email + password 登入")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"hashed_password": hash_password(payload.password),
                  "activated_at": now_iso()},
         "$unset": {"invite_code": ""}},
    )

    await _write_audit(
        action="account_activated_by_invite",
        actor={"id": user["id"], "email": user["email"], "role": user.get("role")},
        target_kind="user",
        target_id=user["id"],
        meta={"role": user.get("role"), "class_name": user.get("class_name")},
    )

    token = create_access_token(user["id"])
    fresh = await db.users.find_one({"id": user["id"]})
    return AuthOut(access_token=token, user=_user_to_out(fresh))


# ==============================================================================
# Password reset — 6-digit OTP delivered via Resend email
# ==============================================================================


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class VerifyOtpIn(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordIn(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


def _generate_otp() -> str:
    """6-digit numeric OTP · zero-padded · secrets-backed."""
    return f"{secrets.randbelow(1_000_000):06d}"


@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordIn):
    """Generates 6-digit OTP · emails it via Resend · stores hashed OTP in DB (15 min TTL).

    Returns 200 with { ok: true } regardless of whether the email exists, to prevent
    enumeration attacks. Only the actual account owner receives the OTP email.
    """
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})

    # Always respond OK · even if user not found (anti-enumeration)
    if not user:
        return {"ok": True, "message": "如果呢個 email 有帳戶，我哋已經寄咗驗證碼過去。"}

    # Invite-only account · not yet activated · can't reset
    if not user.get("hashed_password"):
        return {"ok": True, "message": "如果呢個 email 有帳戶，我哋已經寄咗驗證碼過去。"}

    otp = _generate_otp()
    hashed_otp = hash_password(otp)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

    # Invalidate any previous outstanding OTP for this user (single-shot)
    await db.password_resets.delete_many({"email": email})
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "user_id": user["id"],
        "hashed_otp": hashed_otp,
        "expires_at": expires_at,
        "attempts": 0,
        "created_at": now_iso(),
    })

    send_password_reset_otp(email, user.get("display_name"), otp, minutes_valid=15)

    await _write_audit(
        action="password_reset_requested",
        actor={"id": user["id"], "email": email, "role": user.get("role")},
        target_kind="user",
        target_id=user["id"],
        meta={},
    )
    return {"ok": True, "message": "如果呢個 email 有帳戶，我哋已經寄咗驗證碼過去。"}


@api_router.post("/auth/reset-password", response_model=AuthOut)
async def reset_password(payload: ResetPasswordIn):
    """Validates OTP · sets new password · returns a fresh JWT so user is logged in."""
    email = payload.email.lower().strip()
    otp = payload.otp.strip()
    new_pwd = payload.new_password

    if len(new_pwd) < 6:
        raise HTTPException(status_code=400, detail="密碼至少要 6 個字")

    rec = await db.password_resets.find_one({"email": email})
    if not rec:
        raise HTTPException(status_code=400, detail="驗證碼無效或已過期，請重新申請")

    # Expiry check
    try:
        expires_dt = datetime.fromisoformat(rec["expires_at"])
        if expires_dt < datetime.now(timezone.utc):
            await db.password_resets.delete_one({"id": rec["id"]})
            raise HTTPException(status_code=400, detail="驗證碼已過期，請重新申請")
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="驗證碼無效")

    # Attempt limiting — 5 attempts max before invalidation
    if rec.get("attempts", 0) >= 5:
        await db.password_resets.delete_one({"id": rec["id"]})
        raise HTTPException(status_code=429, detail="嘗試次數過多，請重新申請驗證碼")

    if not verify_password(otp, rec["hashed_otp"]):
        await db.password_resets.update_one({"id": rec["id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="驗證碼錯誤")

    user = await db.users.find_one({"id": rec["user_id"]})
    if not user:
        await db.password_resets.delete_one({"id": rec["id"]})
        raise HTTPException(status_code=404, detail="帳戶唔存在")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"hashed_password": hash_password(new_pwd),
                  "password_reset_at": now_iso()}},
    )
    await db.password_resets.delete_one({"id": rec["id"]})

    await _write_audit(
        action="password_reset_completed",
        actor={"id": user["id"], "email": email, "role": user.get("role")},
        target_kind="user",
        target_id=user["id"],
        meta={},
    )

    token = create_access_token(user["id"])
    fresh = await db.users.find_one({"id": user["id"]})
    return AuthOut(access_token=token, user=_user_to_out(fresh))


# ==============================================================================
# Resend invite email — admin can re-send an invite code by email
# ==============================================================================


class ResendInviteIn(BaseModel):
    email: EmailStr


@api_router.post("/admin/resend-invite")
async def resend_invite(payload: ResendInviteIn, current=Depends(get_current_user)):
    """Re-send the existing invite code for a not-yet-activated student/parent."""
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")

    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Email 找唔到")
    if user.get("hashed_password"):
        raise HTTPException(status_code=400, detail="呢個帳戶已經啟用咗，唔需要邀請碼")
    code = user.get("invite_code")
    if not code:
        raise HTTPException(status_code=400, detail="呢個帳戶冇 pending invite code")

    school_name = None
    try:
        school_cfg = await get_school_config()
        school_name = school_cfg.get("school_name")
    except Exception:
        pass

    ok = send_invite_email(
        to=email,
        display_name=user.get("display_name"),
        invite_code=code,
        school_name=school_name,
        class_name=user.get("class_name"),
    )

    await _write_audit(
        action="invite_email_resent",
        actor=current,
        target_kind="user",
        target_id=user["id"],
        meta={"email": email, "delivered": ok},
    )
    return {"ok": True, "delivered": ok, "email": email}


@api_router.get("/admin/audit")
async def list_audit_log(
    action: Optional[str] = None,
    limit: int = 200,
    current=Depends(get_current_user),
):
    if current.get("role") != "school_admin":
        raise HTTPException(status_code=403, detail="Only school admin")
    filters: dict = {}
    if action:
        filters["action"] = action
    docs = await db.audit_log.find(filters, {"_id": 0}).sort("created_at", -1).to_list(min(max(limit, 1), 500))
    return docs


# ==============================================================================
# Data export & deletion — PDPO / GDPR compliance
# ==============================================================================


@api_router.get("/me/export")
async def export_my_data(current=Depends(get_current_user)):
    uid = current["id"]
    email = current.get("email")

    profile = {k: v for k, v in current.items() if k not in {"hashed_password", "_id", "secret_pin_hash"}}
    entries = await db.entries.find({"user_id": uid}, {"_id": 0}).to_list(2000)
    reactions = await db.reactions.find({"user_id": uid}, {"_id": 0}).to_list(2000)
    my_alerts = await db.alerts.find(
        {"student_id": uid},
        {"_id": 0, "note_snippet": 0},
    ).to_list(1000)

    await _write_audit(
        action="data_exported",
        actor=current,
        target_kind="user",
        target_id=uid,
        meta={"email": email, "entries_count": len(entries), "alerts_count": len(my_alerts)},
    )

    return {
        "exported_at": now_iso(),
        "user": profile,
        "entries": entries,
        "reactions": reactions,
        "alerts_about_me": my_alerts,
        "note": "呢個係你喺 Moodful 嘅完整個人資料 · 可以下載保存。如需刪除 · 用 /me/delete。",
    }


@api_router.delete("/me")
async def delete_my_account(current=Depends(get_current_user)):
    """Right-to-be-forgotten · wipes user's diary + reactions + account.
    Alert metadata retained (anonymised) for 7 years for safety compliance. Audit-logged."""
    uid = current["id"]
    email = current.get("email")

    e = await db.entries.delete_many({"user_id": uid})
    r = await db.reactions.delete_many({"user_id": uid})
    await db.alerts.update_many(
        {"student_id": uid},
        {"$set": {
            "student_email": None,
            "student_display_name": "(已刪除用戶)",
            "note_snippet": None,
            "anonymised_at": now_iso(),
        }},
    )
    await db.users.update_many({"parent_emails": email}, {"$pull": {"parent_emails": email}})
    await db.users.update_many({"child_emails": email}, {"$pull": {"child_emails": email}})
    await db.users.update_many({"parent_email": email}, {"$set": {"parent_email": None}})
    await db.users.delete_one({"id": uid})

    await _write_audit(
        action="account_self_deleted",
        actor=current,
        target_kind="user",
        target_id=uid,
        meta={"email": email, "entries_wiped": e.deleted_count, "reactions_wiped": r.deleted_count},
    )
    return {"deleted": True, "entries_wiped": e.deleted_count, "reactions_wiped": r.deleted_count}


@api_router.post("/entries/{entry_id}/react", response_model=EntryOut)
async def react_entry(entry_id: str, current=Depends(get_current_user)):
    entry = await db.entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    existing = await db.reactions.find_one({"entry_id": entry_id, "user_id": current["id"]})
    if existing:
        await db.reactions.delete_one({"entry_id": entry_id, "user_id": current["id"]})
    else:
        await db.reactions.insert_one({
            "id": str(uuid.uuid4()),
            "entry_id": entry_id,
            "user_id": current["id"],
            "created_at": now_iso(),
        })
    result = await _entries_with_hearts([entry], current["id"])
    return result[0]


# Default keyword suggestions — Admin can freely add/remove.
# Persisted to `school_config` collection on first startup · admins own their list afterwards.
DEFAULT_ALERT_KEYWORDS = [
    "想死", "自殺", "傷害自己", "唔想再返學", "打我", "救命",
    "跳樓", "跳橋", "跳海", "食藥自殺", "劏頸", "冇人愛", "唔想活",
    "想結束", "咁樣落去", "無意義",
]

# BAN list — content that cannot appear in PUBLIC community posts (is_public=True).
# Diary / private entries are NOT filtered by this list · users can freely vent in private.
# Schools customize on the admin panel · backend seeds this initial suggestion once then defers to DB.
DEFAULT_POST_BAN_KEYWORDS = [
    # Cantonese/HK common profanity — kept intentionally minimal on backend.
    "屌", "你老母", "仆街", "冚家鏟", "死開", "賤人", "八婆", "X你",
    "傻仔", "傻婆", "廢人", "低B", "白痴", "智障",
]

SCHOOL_CONFIG_ID = "default"  # single-school MVP · one config doc for the whole app


async def get_school_config() -> dict:
    """Fetch the school-wide config doc · lazy-create with defaults on first read.
    Contains admin-owned keyword lists + notify-parent toggle."""
    doc = await db.school_config.find_one({"id": SCHOOL_CONFIG_ID}, {"_id": 0})
    if doc:
        return doc
    doc = {
        "id": SCHOOL_CONFIG_ID,
        "diary_keywords": list(DEFAULT_ALERT_KEYWORDS),
        "post_ban_keywords": list(DEFAULT_POST_BAN_KEYWORDS),
        "block_crisis_in_posts": True,   # crisis words also blocked from public posts
        "notify_parents_on_alert": False, # parents opt-in per school · default OFF (sensitive)
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    try:
        await db.school_config.insert_one(doc)
    except Exception:
        # concurrent insert — re-read
        existing = await db.school_config.find_one({"id": SCHOOL_CONFIG_ID}, {"_id": 0})
        if existing:
            return existing
    return doc



# Roles that can moderate community — delete other users' PUBLIC posts.
# Keeps private diary entries strictly owner-only.
MODERATOR_ROLES = {"school_admin", "counsellor"}


async def _check_and_create_alert(entry_doc: dict, author: dict):
    """Scan a new entry's note against alert keywords · create alert record if any match.
    Fully non-blocking — errors are logged but don't fail the entry creation.

    PRIVACY MODEL: we DO store the note snippet in DB · but the /alerts read endpoint
    only surfaces it to counsellors when `counsellor_can_view_note_content=True` (school
    admin toggle) and the counsellor explicitly requests reveal (audit-logged).
    """
    try:
        note = (entry_doc.get("note") or "").strip()
        if not note:
            return
        cfg = await get_school_config()
        diary_keywords = cfg.get("diary_keywords") or []
        matched = [kw for kw in diary_keywords if kw and kw in note]
        if not matched:
            return
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()),
            "entry_id": entry_doc["id"],
            "student_id": author["id"],
            "student_email": author["email"],
            "student_display_name": author.get("display_name"),
            "student_role": author.get("role", "student"),
            "matched_keywords": matched,
            "note_snippet": note[:400],  # stored · but revealed only via /alerts/{id}/reveal
            "entry_date": entry_doc.get("entry_date"),
            "created_at": now_iso(),
            "status": "open",           # open · reviewed · resolved
            "reviewed_by": None,
            "reviewed_at": None,
            "source": "diary",
            "alert_type": "crisis_keyword",
        })
        await _write_audit(
            action="alert_triggered",
            actor=author,
            target_kind="alert",
            target_id=None,
            meta={"source": "diary", "matched": matched, "student_id": author["id"]},
        )
        # Fire push notifications to the responders (non-blocking)
        try:
            recipients = await _push_alert_recipients("diary", "crisis_keyword", author["id"])
            await send_push(
                recipients=recipients,
                title="🚨 學生觸發警報",
                message=f"{author.get('display_name') or '學生'} · 日記出現：{'、'.join(matched[:3])}",
                action_url="/counsellor-panel",
            )
        except Exception as e:
            logger.warning(f"Push (diary alert) failed: {e}")
        logger.warning(
            f"ALERT: keywords {matched} detected in entry by {author.get('email')} "
            f"({author.get('role')})"
        )
    except Exception as e:
        logger.error(f"Alert scan failed: {e}")


async def _log_blocked_post_alert(
    *,
    author: dict,
    note_text: str,
    matched_ban: List[str],
    matched_crisis: List[str],
    entry_date: Optional[str] = None,
):
    """Record an alert when a public post is BLOCKED by content policy."""
    try:
        if not (matched_ban or matched_crisis):
            return
        alert_type = "blocked_crisis_post" if matched_crisis else "blocked_profanity_post"
        note = (note_text or "").strip()
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()),
            "entry_id": None,
            "student_id": author["id"],
            "student_email": author["email"],
            "student_display_name": author.get("display_name"),
            "student_role": author.get("role", "student"),
            "matched_keywords": matched_crisis + matched_ban,
            "matched_ban": matched_ban,
            "matched_crisis": matched_crisis,
            "note_snippet": note[:400],
            "entry_date": entry_date,
            "created_at": now_iso(),
            "status": "open",
            "reviewed_by": None,
            "reviewed_at": None,
            "source": "community_post",
            "alert_type": alert_type,
        })
        await _write_audit(
            action="alert_triggered",
            actor=author,
            target_kind="alert",
            target_id=None,
            meta={"source": "community_post", "alert_type": alert_type,
                  "matched_ban": matched_ban, "matched_crisis": matched_crisis,
                  "student_id": author["id"]},
        )
        # Push responders
        try:
            recipients = await _push_alert_recipients("community_post", alert_type, author["id"])
            all_matched = (matched_crisis + matched_ban)[:3]
            body_prefix = "🚫 學生想出 post 但被攔截" if alert_type == "blocked_profanity_post" else "🚨 學生想出 post · 含危機字"
            await send_push(
                recipients=recipients,
                title=body_prefix,
                message=f"{author.get('display_name') or '學生'} · {'、'.join(all_matched)}",
                action_url="/counsellor-panel",
            )
        except Exception as e:
            logger.warning(f"Push (blocked post alert) failed: {e}")
        logger.warning(
            f"BLOCKED-POST ALERT: {alert_type} ban={matched_ban} crisis={matched_crisis} "
            f"by {author.get('email')} ({author.get('role')})"
        )
    except Exception as e:
        logger.error(f"Blocked-post alert failed: {e}")


# ==============================================================================
# Audit log — records privacy-sensitive & safety-critical events.
# Retention: 7 years (HK PDPO guidance). Only school_admin can read; nobody can delete.
# NEVER store note/diary content here — only metadata (who / when / what / target-id / reason).
# ==============================================================================


async def _write_audit(
    *,
    action: str,
    actor: Optional[dict] = None,
    target_kind: Optional[str] = None,
    target_id: Optional[str] = None,
    meta: Optional[dict] = None,
):
    """Fire-and-forget audit record. Never throws · missing fields OK."""
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "action": action,                                  # e.g. "alert_reviewed"
            "actor_id": (actor or {}).get("id"),
            "actor_email": (actor or {}).get("email"),
            "actor_role": (actor or {}).get("role"),
            "target_kind": target_kind,                        # "alert" | "user" | "school" | "family"…
            "target_id": target_id,
            "meta": meta or {},                                # small JSON · no note text
            "created_at": now_iso(),
        }
        await db.audit_log.insert_one(doc)
    except Exception as e:
        logger.error(f"Audit write failed for {action}: {e}")


@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str, current=Depends(get_current_user)):
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    is_owner = entry["user_id"] == current["id"]
    user_role = current.get("role", "student")
    is_moderator = user_role in MODERATOR_ROLES and entry.get("is_public")

    if not (is_owner or is_moderator):
        raise HTTPException(status_code=403, detail="Not permitted to delete this entry")

    await db.entries.delete_one({"id": entry_id})
    await db.reactions.delete_many({"entry_id": entry_id})

    # Audit trail — record moderation actions (not owner self-deletes)
    if not is_owner and is_moderator:
        await db.moderation_log.insert_one({
            "id": str(uuid.uuid4()),
            "entry_id": entry_id,
            "entry_note_snippet": (entry.get("note") or "")[:200],
            "entry_author_id": entry["user_id"],
            "entry_author_role": entry.get("author_role"),
            "moderator_id": current["id"],
            "moderator_email": current["email"],
            "moderator_role": user_role,
            "deleted_at": now_iso(),
        })

    return {"ok": True, "moderated": (not is_owner and is_moderator)}


@api_router.patch("/entries/{entry_id}", response_model=EntryOut)
async def update_entry(entry_id: str, data: EntryUpdate, current=Depends(get_current_user)):
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry["user_id"] != current["id"]:
        raise HTTPException(status_code=403, detail="Not your entry")
    update_doc = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    # Keep primary emotion + emotions list in sync
    if "emotions" in update_doc:
        if not update_doc["emotions"]:
            raise HTTPException(status_code=400, detail="At least one emotion is required")
        update_doc["emotion"] = update_doc["emotions"][0]
    elif "emotion" in update_doc:
        # single-emotion legacy path — also refresh emotions list
        update_doc["emotions"] = [update_doc["emotion"]]
    # secret entries are always private
    if update_doc.get("is_secret"):
        update_doc["is_public"] = False
    if update_doc:
        await db.entries.update_one({"id": entry_id}, {"$set": update_doc})
    fresh = await db.entries.find_one({"id": entry_id}, {"_id": 0})
    result = await _entries_with_hearts([fresh], current["id"])
    return result[0]


@api_router.post("/entries/{entry_id}/feature", response_model=UserOut)
async def set_featured_entry(entry_id: str, current=Depends(get_current_user)):
    """Mark an entry as the 'featured' one whose icon appears on the calendar for its date."""
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry["user_id"] != current["id"]:
        raise HTTPException(status_code=403, detail="Not your entry")
    date_key = entry["entry_date"]
    featured = current.get("featured_by_date") or {}
    featured[date_key] = entry_id
    await db.users.update_one({"id": current["id"]}, {"$set": {"featured_by_date": featured}})
    fresh = await db.users.find_one({"id": current["id"]})
    return _user_to_out(fresh)


# ============ Task Routes ============
@api_router.post("/tasks", response_model=TaskOut)
async def create_task(data: TaskIn, current=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "title": data.title,
        "completed": False,
        "task_date": data.task_date,
        "created_at": now_iso(),
    }
    await db.tasks.insert_one(doc)
    return TaskOut(**doc)


@api_router.get("/tasks", response_model=List[TaskOut])
async def list_tasks(task_date: Optional[str] = None, current=Depends(get_current_user)):
    q = {"user_id": current["id"]}
    if task_date:
        q["task_date"] = task_date
    docs = await db.tasks.find(q, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [TaskOut(**d) for d in docs]


@api_router.patch("/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, data: TaskUpdate, current=Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": current["id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if update:
        # Award / revoke a credit when the completed flag flips.
        if "completed" in update and update["completed"] != task.get("completed", False):
            delta = 1 if update["completed"] else -1
            new_credits = max(0, current.get("credits", 0) + delta)
            await db.users.update_one({"id": current["id"]}, {"$set": {"credits": new_credits}})
        await db.tasks.update_one({"id": task_id}, {"$set": update})
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return TaskOut(**task)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current=Depends(get_current_user)):
    r = await db.tasks.delete_one({"id": task_id, "user_id": current["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


# ============ Memory Routes ============
@api_router.post("/memories", response_model=MemoryOut)
async def create_memory(data: MemoryIn, current=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "prompt_key": data.prompt_key,
        "prompt_text": data.prompt_text,
        "stage": data.stage,
        "response": data.response,
        "created_at": now_iso(),
    }
    await db.memories.insert_one(doc)
    return MemoryOut(**doc)


@api_router.get("/memories", response_model=List[MemoryOut])
async def list_memories(current=Depends(get_current_user)):
    docs = await db.memories.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [MemoryOut(**d) for d in docs]


@api_router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, current=Depends(get_current_user)):
    r = await db.memories.delete_one({"id": memory_id, "user_id": current["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"ok": True}


# ============ Premium / Settings ============
class UpgradeIn(BaseModel):
    plan: str = "lifetime"  # placeholder — this is a mocked unlock


@api_router.post("/premium/upgrade", response_model=UserOut)
async def upgrade_premium(_: UpgradeIn, current=Depends(get_current_user)):
    """Mock upgrade — flips is_premium to True. Replace with real Stripe/IAP later."""
    await db.users.update_one({"id": current["id"]}, {"$set": {"is_premium": True}})
    user = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return _user_to_out(user)


class PinIn(BaseModel):
    pin: str = Field(min_length=4, max_length=4)


@api_router.post("/premium/set-pin", response_model=UserOut)
async def set_pin(data: PinIn, current=Depends(get_current_user)):
    if not data.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    await db.users.update_one({"id": current["id"]}, {"$set": {"secret_pin_hash": hash_password(data.pin)}})
    user = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return _user_to_out(user)


@api_router.post("/premium/verify-pin")
async def verify_pin(data: PinIn, current=Depends(get_current_user)):
    if not current.get("secret_pin_hash"):
        raise HTTPException(status_code=400, detail="No PIN set")
    ok = verify_password(data.pin, current["secret_pin_hash"])
    return {"ok": ok}


class StyleIn(BaseModel):
    diary_style: Optional[dict] = None
    active_icon_pack: Optional[str] = None


@api_router.patch("/premium/settings", response_model=UserOut)
async def update_settings(data: StyleIn, current=Depends(get_current_user)):
    update: dict = {}
    if data.diary_style is not None:
        update["diary_style"] = data.diary_style
    if data.active_icon_pack is not None:
        update["active_icon_pack"] = data.active_icon_pack
    if update:
        await db.users.update_one({"id": current["id"]}, {"$set": update})
    user = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return _user_to_out(user)


# ============ Admin ============
def _require_admin(current: dict):
    if current["email"].lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin only")


class AdminUserOut(BaseModel):
    id: str
    email: EmailStr
    display_name: Optional[str] = None
    created_at: str
    is_premium: bool
    credits: int
    entry_count: int


class AdminStats(BaseModel):
    users: int
    entries: int
    public_entries: int
    tasks: int
    memories: int
    premium_users: int


@api_router.get("/admin/stats", response_model=AdminStats)
async def admin_stats(current=Depends(get_current_user)):
    _require_admin(current)
    users = await db.users.count_documents({})
    entries = await db.entries.count_documents({})
    public_entries = await db.entries.count_documents({"is_public": True})
    tasks = await db.tasks.count_documents({})
    memories = await db.memories.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    return AdminStats(
        users=users,
        entries=entries,
        public_entries=public_entries,
        tasks=tasks,
        memories=memories,
        premium_users=premium_users,
    )


@api_router.get("/admin/users", response_model=List[AdminUserOut])
async def admin_users(current=Depends(get_current_user)):
    _require_admin(current)
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0, "secret_pin_hash": 0}).sort("created_at", -1).to_list(500)
    out: List[AdminUserOut] = []
    for u in users:
        count = await db.entries.count_documents({"user_id": u["id"]})
        out.append(AdminUserOut(
            id=u["id"], email=u["email"], display_name=u.get("display_name"),
            created_at=u["created_at"], is_premium=u.get("is_premium", False),
            credits=u.get("credits", 0), entry_count=count,
        ))
    return out


@api_router.get("/admin/community", response_model=List[EntryOut])
async def admin_community(current=Depends(get_current_user)):
    _require_admin(current)
    docs = await db.entries.find({"is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return await _entries_with_hearts(docs, current["id"])


# ==============================================================================
# Push notifications — Emergent-managed relay
# ==============================================================================


class RegisterPushBody(BaseModel):
    user_id: str
    platform: str  # "android" | "ios"
    device_token: str


@api_router.post("/register-push", status_code=201)
async def register_push_endpoint(body: RegisterPushBody):
    """Called by the app after login · registers this device with the push relay."""
    try:
        await register_device(body.user_id, body.platform, body.device_token)
    except RuntimeError as e:
        # Key missing/invalid · but we don't hard-fail so preview app still works.
        logger.warning(f"Push register failed (non-blocking): {e}")
        return {"status": "skipped", "reason": str(e)}
    except Exception as e:
        logger.warning(f"Push register error (non-blocking): {e}")
        return {"status": "skipped", "reason": "provider unavailable"}
    return {"status": "registered"}


async def _push_alert_recipients(alert_source: str, alert_type: str, student_id: str) -> list[str]:
    """Resolve which user IDs should receive the alert push.
    - Counsellors and school_admin always get all alerts
    - Class teacher gets alerts for their class students
    - Parents get alerts if school toggle ON + they're linked to this student
    """
    ids: set[str] = set()

    # 1) All counsellors + school admins
    async for u in db.users.find(
        {"role": {"$in": ["counsellor", "school_admin"]}},
        {"_id": 0, "id": 1},
    ):
        ids.add(u["id"])

    # 2) Class teacher(s) if the student has a class
    stu = await db.users.find_one({"id": student_id}, {"_id": 0, "class_name": 1})
    if stu and stu.get("class_name"):
        async for t in db.users.find(
            {"role": "teacher", "class_name": stu["class_name"]},
            {"_id": 0, "id": 1},
        ):
            ids.add(t["id"])

    # 3) Parents · if toggle on
    cfg = await get_school_config()
    if cfg.get("notify_parents_on_alert", False) and stu:
        stu_full = await db.users.find_one({"id": student_id}, {"_id": 0, "email": 1})
        stu_email = (stu_full or {}).get("email")
        if stu_email:
            async for p in db.users.find(
                {"role": "parent",
                 "$or": [{"child_emails": stu_email}, {"parent_email": stu_email}]},
                {"_id": 0, "id": 1},
            ):
                ids.add(p["id"])

    ids.discard(student_id)  # student themselves shouldn't get the alert push
    return list(ids)


@api_router.delete("/admin/entries/{entry_id}")
async def admin_delete_entry(entry_id: str, current=Depends(get_current_user)):
    _require_admin(current)
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.entries.delete_one({"id": entry_id})
    await db.reactions.delete_many({"entry_id": entry_id})
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "Moodful API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def promote_all_to_premium():
    """One-time migration: since features are now free for all students, ensure every
    existing user has is_premium=True so gated UI is unlocked. Idempotent — safe to
    re-run on every boot."""
    try:
        result = await db.users.update_many({"is_premium": {"$ne": True}}, {"$set": {"is_premium": True}})
        if result.modified_count:
            logger.info(f"Promoted {result.modified_count} existing users to premium")
    except Exception as e:
        logger.warning(f"Premium promotion migration failed: {e}")


@app.on_event("startup")
async def seed_demo_role_accounts():
    """Seed demo accounts — 2 students + one per adult role — for clean demos.
    Idempotent: only creates missing accounts, never overwrites.
    Password for all demo accounts: `demo1234`."""
    DEMO_ACCOUNTS = [
        {"email": "student@demo.moodful.app",     "role": "student",      "name": "陳小明 (學生 A)", "class_name": "6A", "parent_email": "parent@demo.moodful.app"},
        {"email": "student2@demo.moodful.app",    "role": "student",      "name": "李小美 (學生 B)", "class_name": "6A"},
        {"email": "teacher@demo.moodful.app",     "role": "teacher",      "name": "陳老師 (班主任)", "class_name": "6A"},
        {"email": "counsellor@demo.moodful.app",  "role": "counsellor",   "name": "李輔導 (輔導老師)"},
        {"email": "parent@demo.moodful.app",      "role": "parent",       "name": "王太 (家長)"},
        {"email": "school@demo.moodful.app",      "role": "school_admin", "name": "校長 (校方管理)"},
    ]
    demo_password_hash = hash_password("demo1234")
    created = 0
    updated = 0
    for acc in DEMO_ACCOUNTS:
        existing = await db.users.find_one({"email": acc["email"]})
        if existing:
            change = {}
            if existing.get("role") != acc["role"]:
                change["role"] = acc["role"]
            if acc.get("class_name") and existing.get("class_name") != acc["class_name"]:
                change["class_name"] = acc["class_name"]
            if acc.get("parent_email") and existing.get("parent_email") != acc["parent_email"]:
                change["parent_email"] = acc["parent_email"]
            if change:
                await db.users.update_one({"email": acc["email"]}, {"$set": change})
                updated += 1
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "email": acc["email"],
            "display_name": acc["name"],
            "hashed_password": demo_password_hash,
            "created_at": now_iso(),
            "credits": 20,
            "is_premium": True,
            "secret_pin_hash": None,
            "diary_style": {},
            "active_icon_pack": "classic",
            "role": acc["role"],
            "class_name": acc.get("class_name"),
            "parent_email": acc.get("parent_email"),
        }
        await db.users.insert_one(doc)
        created += 1
    if created or updated:
        logger.info(f"Demo accounts seeded — created: {created}, role-updated: {updated}")
    await _seed_demo_community_entries()


async def _seed_demo_community_entries():
    """Seed a handful of public community entries so the feed isn't empty.
    Idempotent — checks by (user_email, note fingerprint) before inserting."""
    demo_posts = [
        # Student posts — 學生社群
        {"email": "student@demo.moodful.app",   "emotion": "sad",     "note": "今日測驗成績唔理想 · 有啲失落 · 但知道下次可以再努力",   "days_ago": 0},
        {"email": "student@demo.moodful.app",   "emotion": "happy",   "note": "同同學一齊食嘢好開心 · 平時好少咁笑",                    "days_ago": 1},
        {"email": "student2@demo.moodful.app",  "emotion": "anxious", "note": "聽日要小組報告 · 有啲驚 · 希望順利",                       "days_ago": 0},
        {"email": "student2@demo.moodful.app",  "emotion": "tired",   "note": "呢排功課多 · 有少少頂唔順 · 但仲有 2 日就 weekend",       "days_ago": 2},
        # Adult posts — 大人社群（學生睇唔到）
        {"email": "teacher@demo.moodful.app",   "emotion": "tired",   "note": "改完 3 班嘅默書簿 · 眼都花 · 大家點紓緩眼疲勞？",         "days_ago": 0},
        {"email": "teacher@demo.moodful.app",   "emotion": "content", "note": "見到學生仔今日主動幫其他人 · 覺得好安慰",                 "days_ago": 1},
        {"email": "counsellor@demo.moodful.app","emotion": "peaceful","note": "同一位家長傾咗個幾鐘 · 佢終於肯放低對小朋友嘅期望 · 好感恩", "days_ago": 0},
        {"email": "parent@demo.moodful.app",    "emotion": "anxious", "note": "小朋友升中一 · 我比佢仲緊張 · 有冇同路家長分享吓？",       "days_ago": 1},
        {"email": "parent@demo.moodful.app",    "emotion": "loved",   "note": "細女今日主動 send 心心俾我 · 感動咗一整晚",                "days_ago": 3},
    ]
    inserted = 0
    for p in demo_posts:
        u = await db.users.find_one({"email": p["email"]})
        if not u:
            continue
        # Idempotent check
        existing = await db.entries.find_one({"user_id": u["id"], "note": p["note"]})
        if existing:
            continue
        author_role = u.get("role", "student")
        d = datetime.now(timezone.utc) - timedelta(days=p["days_ago"])
        entry_date = d.strftime("%Y-%m-%d")
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": u["id"],
            "display_name": u.get("display_name"),
            "emotion": p["emotion"],
            "emotions": [p["emotion"]],
            "note": p["note"],
            "is_public": True,
            "is_secret": False,
            "energy_level": None,
            "entry_date": entry_date,
            "created_at": d.isoformat(),
            "author_role": author_role,
            "author_role_label": ROLE_LABELS.get(author_role, author_role),
            "community_scope": community_scope_for(author_role),
        }
        await db.entries.insert_one(doc)
        inserted += 1
    if inserted:
        logger.info(f"Community demo entries seeded: {inserted}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
