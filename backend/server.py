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


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class EntryIn(BaseModel):
    emotion: str
    note: str = ""
    is_public: bool = False
    entry_date: str  # YYYY-MM-DD


class EntryOut(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    emotion: str
    note: str
    is_public: bool
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
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id)
    return AuthOut(
        access_token=token,
        user=UserOut(id=user_id, email=email_lower, display_name=display_name, created_at=created_at, credits=0),
    )


@api_router.post("/auth/login", response_model=AuthOut)
async def login(data: LoginIn):
    email_lower = data.email.lower()
    user = await db.users.find_one({"email": email_lower})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(user["id"])
    return AuthOut(
        access_token=token,
        user=UserOut(
            id=user["id"],
            email=user["email"],
            display_name=user.get("display_name"),
            created_at=user["created_at"],
            credits=user.get("credits", 0),
        ),
    )


@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return UserOut(**current)


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
    doc = {
        "id": entry_id,
        "user_id": current["id"],
        "display_name": current.get("display_name"),
        "emotion": data.emotion,
        "note": data.note,
        "is_public": data.is_public,
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
