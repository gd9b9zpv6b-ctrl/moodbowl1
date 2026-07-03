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


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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
    if not user or not verify_password(data.password, user["hashed_password"]):
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


@api_router.get("/entries/community", response_model=List[EntryOut])
async def community_entries(scope: Optional[str] = None, current=Depends(get_current_user)):
    """Community feed with strict role-based scope enforcement.
    HARD RULE: students can NEVER see adult community — enforced at API level.
    Adults can request either scope · 'both' is the default (school policy can filter
    on the frontend via SchoolCommunityConfig).
    """
    user_role = current.get("role", "student")
    filters: dict = {"is_public": True}

    if user_role == "student":
        # HARD RULE — students see student community only, no exception
        filters["community_scope"] = "student"
    else:
        # Adults may request a specific scope
        if scope in ("student", "adult"):
            filters["community_scope"] = scope
        # otherwise return both — school policy filters on frontend

    docs = await db.entries.find(filters, {"_id": 0}).sort("created_at", -1).to_list(200)
    return await _entries_with_hearts(docs, current["id"])


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


@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str, current=Depends(get_current_user)):
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry["user_id"] != current["id"]:
        raise HTTPException(status_code=403, detail="Not your entry")
    await db.entries.delete_one({"id": entry_id})
    await db.reactions.delete_many({"entry_id": entry_id})
    return {"ok": True}


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
        {"email": "student@demo.moodful.app",     "role": "student",      "name": "陳小明 (學生 A)"},
        {"email": "student2@demo.moodful.app",    "role": "student",      "name": "李小美 (學生 B)"},
        {"email": "teacher@demo.moodful.app",     "role": "teacher",      "name": "陳老師 (班主任)"},
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
            if existing.get("role") != acc["role"]:
                await db.users.update_one({"email": acc["email"]}, {"$set": {"role": acc["role"]}})
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
