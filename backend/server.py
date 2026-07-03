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
    )


class EntryIn(BaseModel):
    emotion: str
    note: str = ""
    is_public: bool = False
    is_secret: bool = False
    entry_date: str  # YYYY-MM-DD


class EntryUpdate(BaseModel):
    emotion: Optional[str] = None
    note: Optional[str] = None
    is_public: Optional[bool] = None
    is_secret: Optional[bool] = None


class EntryOut(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    emotion: str
    note: str
    is_public: bool
    is_secret: bool = False
    entry_date: str
    created_at: str
    hearts: int = 0
    hearted_by_me: bool = False


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
        "is_premium": False,
        "secret_pin_hash": None,
        "diary_style": {},
        "active_icon_pack": "classic",
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
            note=d.get("note", ""),
            is_public=d.get("is_public", False),
            is_secret=d.get("is_secret", False),
            entry_date=d["entry_date"],
            created_at=d["created_at"],
            hearts=hearts_map.get(d["id"], 0),
            hearted_by_me=d["id"] in my_hearts,
        )
        for d in cursor_docs
    ]


@api_router.post("/entries", response_model=EntryOut)
async def create_entry(data: EntryIn, current=Depends(get_current_user)):
    entry_id = str(uuid.uuid4())
    # secret entries are always private
    is_public = data.is_public and not data.is_secret
    doc = {
        "id": entry_id,
        "user_id": current["id"],
        "display_name": current.get("display_name"),
        "emotion": data.emotion,
        "note": data.note,
        "is_public": is_public,
        "is_secret": data.is_secret,
        "entry_date": data.entry_date,
        "created_at": now_iso(),
    }
    await db.entries.insert_one(doc)
    return EntryOut(**doc, hearts=0, hearted_by_me=False)


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
async def community_entries(current=Depends(get_current_user)):
    docs = await db.entries.find({"is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(200)
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
    # secret entries are always private
    if update_doc.get("is_secret"):
        update_doc["is_public"] = False
    if update_doc:
        await db.entries.update_one({"id": entry_id}, {"$set": update_doc})
    fresh = await db.entries.find_one({"id": entry_id}, {"_id": 0})
    result = await _entries_with_hearts([fresh], current["id"])
    return result[0]


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
    if not current.get("is_premium"):
        raise HTTPException(status_code=402, detail="Premium required")
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
    if not current.get("is_premium"):
        raise HTTPException(status_code=402, detail="Premium required")
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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
