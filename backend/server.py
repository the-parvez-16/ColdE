from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import random
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
SECRET_KEY = os.environ.get('JWT_SECRET', 'cold-email-agent-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CampaignCreate(BaseModel):
    name: str
    work_description: str
    email_limit: int = Field(ge=1, le=100)

class EmailTarget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    company: str
    status: str = "pending"  # pending, sent, delivered, replied
    response_category: Optional[str] = None  # positive, negative, no_reply
    sent_at: Optional[str] = None
    replied_at: Optional[str] = None

class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    work_description: str
    email_limit: int
    status: str = "draft"  # draft, processing, finding_emails, sending, completed
    progress: int = 0
    targets: List[EmailTarget] = []
    stats: dict = {}
    created_at: str
    completed_at: Optional[str] = None

class CampaignResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    work_description: str
    email_limit: int
    status: str
    progress: int
    targets: List[dict]
    stats: dict
    created_at: str
    completed_at: Optional[str] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_access_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# ============ MOCK N8N WORKFLOW ============

MOCK_COMPANIES = [
    {"company": "TechCorp Solutions", "domain": "techcorp.com"},
    {"company": "InnovateLab Inc", "domain": "innovatelab.io"},
    {"company": "DataDrive Analytics", "domain": "datadrive.co"},
    {"company": "CloudScale Systems", "domain": "cloudscale.net"},
    {"company": "AI Ventures", "domain": "aiventures.com"},
    {"company": "DigitalFirst Agency", "domain": "digitalfirst.agency"},
    {"company": "GrowthStack", "domain": "growthstack.io"},
    {"company": "Nexus Technologies", "domain": "nexustech.com"},
    {"company": "Quantum Soft", "domain": "quantumsoft.dev"},
    {"company": "Velocity Labs", "domain": "velocitylabs.co"},
]

def generate_mock_email(company: dict, index: int) -> str:
    prefixes = ["ceo", "founder", "hr", "hiring", "info", "contact", "careers"]
    return f"{prefixes[index % len(prefixes)]}@{company['domain']}"

async def simulate_n8n_workflow(campaign_id: str):
    """Simulate n8n workflow: find emails -> send -> track responses"""
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        return
    
    # Phase 1: Finding emails (30%)
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "finding_emails", "progress": 10}}
    )
    await asyncio.sleep(2)
    
    # Generate mock targets
    targets = []
    for i in range(campaign["email_limit"]):
        company = MOCK_COMPANIES[i % len(MOCK_COMPANIES)]
        targets.append({
            "email": generate_mock_email(company, i),
            "company": company["company"],
            "status": "pending",
            "response_category": None,
            "sent_at": None,
            "replied_at": None
        })
    
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"targets": targets, "progress": 30}}
    )
    await asyncio.sleep(1)
    
    # Phase 2: Sending emails (30% -> 80%)
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "sending"}}
    )
    
    for i, target in enumerate(targets):
        await asyncio.sleep(0.3)  # Simulate sending delay
        targets[i]["status"] = "sent"
        targets[i]["sent_at"] = datetime.now(timezone.utc).isoformat()
        
        progress = 30 + int((i + 1) / len(targets) * 50)
        await db.campaigns.update_one(
            {"id": campaign_id},
            {"$set": {"targets": targets, "progress": progress}}
        )
    
    # Phase 3: Simulate responses (80% -> 100%)
    await asyncio.sleep(1)
    
    for i, target in enumerate(targets):
        # Randomly assign response categories
        rand = random.random()
        if rand < 0.25:  # 25% positive
            targets[i]["status"] = "replied"
            targets[i]["response_category"] = "positive"
            targets[i]["replied_at"] = datetime.now(timezone.utc).isoformat()
        elif rand < 0.40:  # 15% negative
            targets[i]["status"] = "replied"
            targets[i]["response_category"] = "negative"
            targets[i]["replied_at"] = datetime.now(timezone.utc).isoformat()
        else:  # 60% no reply
            targets[i]["status"] = "delivered"
            targets[i]["response_category"] = "no_reply"
    
    # Calculate stats
    stats = {
        "total": len(targets),
        "sent": len([t for t in targets if t["status"] in ["sent", "delivered", "replied"]]),
        "delivered": len([t for t in targets if t["status"] in ["delivered", "replied"]]),
        "replied": len([t for t in targets if t["status"] == "replied"]),
        "positive": len([t for t in targets if t["response_category"] == "positive"]),
        "negative": len([t for t in targets if t["response_category"] == "negative"]),
        "no_reply": len([t for t in targets if t["response_category"] == "no_reply"])
    }
    
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "targets": targets,
            "stats": stats,
            "status": "completed",
            "progress": 100,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )

# ============ CAMPAIGN ROUTES ============

@api_router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    campaign_id = str(uuid.uuid4())
    campaign_doc = {
        "id": campaign_id,
        "user_id": current_user["id"],
        "name": data.name,
        "work_description": data.work_description,
        "email_limit": data.email_limit,
        "status": "processing",
        "progress": 0,
        "targets": [],
        "stats": {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.campaigns.insert_one(campaign_doc)
    
    # Start mock n8n workflow in background
    asyncio.create_task(simulate_n8n_workflow(campaign_id))
    
    return CampaignResponse(**{k: v for k, v in campaign_doc.items() if k != "_id"})

@api_router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    campaigns = await db.campaigns.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [CampaignResponse(**c) for c in campaigns]

@api_router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one(
        {"id": campaign_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignResponse(**campaign)

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.campaigns.delete_one(
        {"id": campaign_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted"}

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    campaigns = await db.campaigns.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    total_campaigns = len(campaigns)
    total_emails_sent = sum(c.get("stats", {}).get("sent", 0) for c in campaigns)
    total_positive = sum(c.get("stats", {}).get("positive", 0) for c in campaigns)
    total_negative = sum(c.get("stats", {}).get("negative", 0) for c in campaigns)
    total_no_reply = sum(c.get("stats", {}).get("no_reply", 0) for c in campaigns)
    active_campaigns = len([c for c in campaigns if c.get("status") not in ["completed", "draft"]])
    
    response_rate = (total_positive + total_negative) / total_emails_sent * 100 if total_emails_sent > 0 else 0
    
    return {
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_emails_sent": total_emails_sent,
        "total_positive": total_positive,
        "total_negative": total_negative,
        "total_no_reply": total_no_reply,
        "response_rate": round(response_rate, 1)
    }

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Cold Email AI Agent API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
