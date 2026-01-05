from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    user_type: str  # 'pet_owner' or 'vet'
    created_at: datetime

class UserSession(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str  # 'pet_owner' or 'vet'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VetProfile(BaseModel):
    user_id: str
    license_number: str
    specialty: str
    location: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int = 0
    available: bool = True
    rating: float = 0.0
    created_at: datetime

class VetProfileCreate(BaseModel):
    license_number: str
    specialty: str
    location: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int = 0

class Appointment(BaseModel):
    appointment_id: str
    pet_owner_id: str
    vet_id: str
    appointment_date: str
    appointment_time: str
    pet_name: str
    pet_type: str
    reason: str
    status: str  # 'pending', 'confirmed', 'completed', 'cancelled'
    amount: float
    payment_status: str  # 'pending', 'paid', 'refunded'
    created_at: datetime

class AppointmentCreate(BaseModel):
    vet_id: str
    appointment_date: str
    appointment_time: str
    pet_name: str
    pet_type: str
    reason: str

class EmergencyRequest(BaseModel):
    request_id: str
    pet_owner_id: str
    location: str
    description: str
    pet_name: str
    pet_type: str
    status: str  # 'active', 'accepted', 'completed', 'cancelled'
    assigned_vet_id: Optional[str] = None
    created_at: datetime

class EmergencyRequestCreate(BaseModel):
    location: str
    description: str
    pet_name: str
    pet_type: str

class Message(BaseModel):
    message_id: str
    chat_id: str
    sender_id: str
    content: str
    created_at: datetime

class MessageCreate(BaseModel):
    chat_id: str
    content: str

class Chat(BaseModel):
    chat_id: str
    pet_owner_id: str
    vet_id: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime


# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_session_token() -> str:
    return f"session_{uuid.uuid4().hex}"

async def get_user_from_session(session_token: str = None, authorization: str = None) -> Optional[Dict]:
    """Get user from session token (cookie or header)"""
    token = session_token or (authorization.replace('Bearer ', '') if authorization else None)
    
    if not token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    return user_doc


# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user = {
        "user_id": user_id,
        "email": user_data.email,
        "password": hashed_pw,
        "name": user_data.name,
        "user_type": user_data.user_type,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    # Create session
    session_token = create_session_token()
    session = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    user_response = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return {"user": user_response, "session_token": session_token}


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = create_session_token()
    session = {
        "session_token": session_token,
        "user_id": user_doc["user_id"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    user_response = await db.users.find_one({"user_id": user_doc["user_id"]}, {"_id": 0, "password": 0})
    return {"user": user_response, "session_token": session_token}


@api_router.post("/auth/google-session")
async def google_session(request: Request):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent OAuth API
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            data = await resp.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": data["email"]})
    
    if user_doc:
        user_id = user_doc["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data["picture"]
            }}
        )
    else:
        # Create new user - default to pet_owner, they can switch later
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data["picture"],
            "user_type": "pet_owner",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Create session with Emergent session token
    session_token = data["session_token"]
    session = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    user_response = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return {"user": user_response, "session_token": session_token}


@api_router.get("/auth/me")
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api_router.post("/auth/logout")
async def logout(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    return {"message": "Logged out successfully"}


# ==================== VET PROFILE ENDPOINTS ====================

@api_router.post("/vet/profile")
async def create_vet_profile(profile_data: VetProfileCreate, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if profile exists
    existing_profile = await db.vet_profiles.find_one({"user_id": user["user_id"]})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = {
        "user_id": user["user_id"],
        "license_number": profile_data.license_number,
        "specialty": profile_data.specialty,
        "location": profile_data.location,
        "phone": profile_data.phone,
        "bio": profile_data.bio,
        "experience_years": profile_data.experience_years,
        "available": True,
        "rating": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vet_profiles.insert_one(profile)
    
    # Update user type to vet
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"user_type": "vet"}})
    
    return await db.vet_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})


@api_router.get("/vet/profile/me")
async def get_my_vet_profile(request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    profile = await db.vet_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile


@api_router.get("/vets")
async def get_vets(specialty: Optional[str] = None, location: Optional[str] = None):
    query = {"available": True}
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    vet_profiles = await db.vet_profiles.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    for profile in vet_profiles:
        user_doc = await db.users.find_one({"user_id": profile["user_id"]}, {"_id": 0, "password": 0})
        if user_doc:
            profile["name"] = user_doc["name"]
            profile["picture"] = user_doc.get("picture")
    
    return vet_profiles


@api_router.get("/vets/{vet_id}")
async def get_vet_detail(vet_id: str):
    profile = await db.vet_profiles.find_one({"user_id": vet_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Vet not found")
    
    user_doc = await db.users.find_one({"user_id": vet_id}, {"_id": 0, "password": 0})
    if user_doc:
        profile["name"] = user_doc["name"]
        profile["picture"] = user_doc.get("picture")
    
    return profile


# ==================== APPOINTMENT ENDPOINTS ====================

@api_router.post("/appointments")
async def create_appointment(appointment_data: AppointmentCreate, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    appointment_id = f"apt_{uuid.uuid4().hex[:12]}"
    appointment = {
        "appointment_id": appointment_id,
        "pet_owner_id": user["user_id"],
        "vet_id": appointment_data.vet_id,
        "appointment_date": appointment_data.appointment_date,
        "appointment_time": appointment_data.appointment_time,
        "pet_name": appointment_data.pet_name,
        "pet_type": appointment_data.pet_type,
        "reason": appointment_data.reason,
        "status": "pending",
        "amount": 50.0,  # Default consultation fee
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appointments.insert_one(appointment)
    return await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})


@api_router.get("/appointments")
async def get_appointments(request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_type"] == "vet":
        appointments = await db.appointments.find({"vet_id": user["user_id"]}, {"_id": 0}).to_list(100)
    else:
        appointments = await db.appointments.find({"pet_owner_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    for apt in appointments:
        vet_doc = await db.users.find_one({"user_id": apt["vet_id"]}, {"_id": 0, "password": 0})
        owner_doc = await db.users.find_one({"user_id": apt["pet_owner_id"]}, {"_id": 0, "password": 0})
        if vet_doc:
            apt["vet_name"] = vet_doc["name"]
        if owner_doc:
            apt["owner_name"] = owner_doc["name"]
    
    return appointments


@api_router.patch("/appointments/{appointment_id}")
async def update_appointment_status(appointment_id: str, status: str, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": status}}
    )
    return await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})


# ==================== EMERGENCY REQUEST ENDPOINTS ====================

@api_router.post("/emergency")
async def create_emergency_request(emergency_data: EmergencyRequestCreate, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    request_id = f"emr_{uuid.uuid4().hex[:12]}"
    emergency_request = {
        "request_id": request_id,
        "pet_owner_id": user["user_id"],
        "location": emergency_data.location,
        "description": emergency_data.description,
        "pet_name": emergency_data.pet_name,
        "pet_type": emergency_data.pet_type,
        "status": "active",
        "assigned_vet_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.emergency_requests.insert_one(emergency_request)
    return await db.emergency_requests.find_one({"request_id": request_id}, {"_id": 0})


@api_router.get("/emergency")
async def get_emergency_requests(request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_type"] == "vet":
        # Vets see all active emergency requests
        requests = await db.emergency_requests.find({"status": "active"}, {"_id": 0}).to_list(100)
    else:
        # Pet owners see their own requests
        requests = await db.emergency_requests.find({"pet_owner_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    for req in requests:
        owner_doc = await db.users.find_one({"user_id": req["pet_owner_id"]}, {"_id": 0, "password": 0})
        if owner_doc:
            req["owner_name"] = owner_doc["name"]
        if req.get("assigned_vet_id"):
            vet_doc = await db.users.find_one({"user_id": req["assigned_vet_id"]}, {"_id": 0, "password": 0})
            if vet_doc:
                req["vet_name"] = vet_doc["name"]
    
    return requests


@api_router.patch("/emergency/{request_id}/accept")
async def accept_emergency_request(request_id: str, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user or user["user_type"] != "vet":
        raise HTTPException(status_code=403, detail="Only vets can accept emergency requests")
    
    await db.emergency_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "accepted", "assigned_vet_id": user["user_id"]}}
    )
    return await db.emergency_requests.find_one({"request_id": request_id}, {"_id": 0})


# ==================== CHAT/MESSAGE ENDPOINTS ====================

@api_router.post("/chats")
async def create_chat(vet_id: str, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if chat already exists
    existing_chat = await db.chats.find_one({
        "pet_owner_id": user["user_id"],
        "vet_id": vet_id
    })
    
    if existing_chat:
        return await db.chats.find_one({"chat_id": existing_chat["chat_id"]}, {"_id": 0})
    
    chat_id = f"chat_{uuid.uuid4().hex[:12]}"
    chat = {
        "chat_id": chat_id,
        "pet_owner_id": user["user_id"],
        "vet_id": vet_id,
        "last_message": None,
        "last_message_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.insert_one(chat)
    return await db.chats.find_one({"chat_id": chat_id}, {"_id": 0})


@api_router.get("/chats")
async def get_chats(request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_type"] == "vet":
        chats = await db.chats.find({"vet_id": user["user_id"]}, {"_id": 0}).to_list(100)
    else:
        chats = await db.chats.find({"pet_owner_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    for chat in chats:
        vet_doc = await db.users.find_one({"user_id": chat["vet_id"]}, {"_id": 0, "password": 0})
        owner_doc = await db.users.find_one({"user_id": chat["pet_owner_id"]}, {"_id": 0, "password": 0})
        if vet_doc:
            chat["vet_name"] = vet_doc["name"]
            chat["vet_picture"] = vet_doc.get("picture")
        if owner_doc:
            chat["owner_name"] = owner_doc["name"]
            chat["owner_picture"] = owner_doc.get("picture")
    
    return chats


@api_router.post("/messages")
async def send_message(message_data: MessageCreate, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message = {
        "message_id": message_id,
        "chat_id": message_data.chat_id,
        "sender_id": user["user_id"],
        "content": message_data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    
    # Update chat last message
    await db.chats.update_one(
        {"chat_id": message_data.chat_id},
        {"$set": {
            "last_message": message_data.content,
            "last_message_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return await db.messages.find_one({"message_id": message_id}, {"_id": 0})


@api_router.get("/messages/{chat_id}")
async def get_messages(chat_id: str, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    messages = await db.messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    # Enrich with sender data
    for msg in messages:
        sender_doc = await db.users.find_one({"user_id": msg["sender_id"]}, {"_id": 0, "password": 0})
        if sender_doc:
            msg["sender_name"] = sender_doc["name"]
            msg["sender_picture"] = sender_doc.get("picture")
    
    return messages


# ==================== PAYMENT ENDPOINTS ====================

@api_router.post("/payments/checkout")
async def create_checkout_session(appointment_id: str, origin_url: str, request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get appointment
    appointment = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Initialize Stripe
    host_url = origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/appointments"
    
    checkout_request = CheckoutSessionRequest(
        amount=appointment["amount"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "appointment_id": appointment_id,
            "user_id": user["user_id"]
        }
    )
    
    session_response = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store payment transaction
    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    payment_transaction = {
        "payment_id": payment_id,
        "session_id": session_response.session_id,
        "appointment_id": appointment_id,
        "user_id": user["user_id"],
        "amount": appointment["amount"],
        "currency": "usd",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(payment_transaction)
    
    return {"url": session_response.url, "session_id": session_response.session_id}


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    # Initialize Stripe
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    # Get checkout status
    status_response = await stripe_checkout.get_checkout_status(session_id)
    
    # Check if already processed
    payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if payment and payment["payment_status"] == "paid":
        return status_response
    
    # Update payment transaction
    if status_response.payment_status == "paid" and payment:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
        
        # Update appointment payment status
        await db.appointments.update_one(
            {"appointment_id": payment["appointment_id"]},
            {"$set": {"payment_status": "paid", "status": "confirmed"}}
        )
    
    return status_response


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Handle payment success
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            
            if payment and payment["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                await db.appointments.update_one(
                    {"appointment_id": payment["appointment_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "RafikiPets API"}


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
