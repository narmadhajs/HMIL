from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from models import *
from email_service import email_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET_KEY")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict, expires_delta: timedelta = timedelta(hours=1)) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/check-employee")
async def check_employee(data: dict):
    emp_id = data.get("emp_id")
    user = await db.users.find_one({"emp_id": emp_id}, {"_id": 0})
    
    if user:
        if user.get("password"):
            return {"exists": True, "has_password": True}
        else:
            return {"exists": True, "has_password": False}
    
    return {"exists": False, "has_password": False}

@api_router.post("/auth/register")
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    email = user_data.email
    
    if not email.endswith("@hmil.net"):
        raise HTTPException(status_code=400, detail="Email must end with @hmil.net")
    
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    token = create_token({"email": email, "emp_id": user_data.emp_id, "purpose": "password_creation"})
    
    user_doc = {
        "emp_id": user_data.emp_id,
        "email": email,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reset_token": token
    }
    
    await db.users.insert_one(user_doc)
    
    background_tasks.add_task(email_service.send_password_creation_email, email, token)
    
    return {"message": "Password creation link sent to your email"}

@api_router.post("/auth/set-password")
async def set_password(data: SetPassword):
    payload = verify_token(data.token)
    
    if payload.get("purpose") != "password_creation":
        raise HTTPException(status_code=400, detail="Invalid token purpose")
    
    email = payload.get("email")
    emp_id = payload.get("emp_id")
    
    hashed_pwd = hash_password(data.password)
    
    result = await db.users.update_one(
        {"email": email, "emp_id": emp_id},
        {"$set": {"password": hashed_pwd, "name": data.name, "reset_token": None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password set successfully"}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"emp_id": login_data.emp_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("password"):
        raise HTTPException(status_code=400, detail="Password not set. Please complete registration first.")
    
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"emp_id": user["emp_id"], "email": user["email"], "role": user["role"]}, expires_delta=timedelta(days=7))
    
    return {
        "token": token,
        "user": {
            "emp_id": user["emp_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPassword, background_tasks: BackgroundTasks):
    email = data.email
    
    if not email.endswith("@hmil.net"):
        return {"message": "If the email exists, a password reset link has been sent"}
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    token = create_token({"email": email, "emp_id": user["emp_id"], "purpose": "password_reset"})
    
    await db.users.update_one({"email": email}, {"$set": {"reset_token": token}})
    
    background_tasks.add_task(email_service.send_password_reset_email, email, token)
    
    return {"message": "If the email exists, a password reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPassword):
    payload = verify_token(data.token)
    
    if payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid token purpose")
    
    email = payload.get("email")
    
    hashed_pwd = hash_password(data.password)
    
    result = await db.users.update_one(
        {"email": email, "reset_token": data.token},
        {"$set": {"password": hashed_pwd, "reset_token": None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    return {"message": "Password reset successfully"}

@api_router.get("/halls")
async def get_halls():
    halls_data = [
        {"id": "elantra", "name": "Elantra Hall", "capacity": "20 Pax", "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"},
        {"id": "exter", "name": "Exter Hall", "capacity": "12 Pax", "image_url": "https://images.unsplash.com/photo-1772112334844-2eed0111e690?auto=format&fit=crop&w=800&q=80"},
        {"id": "embera", "name": "Embera Hall", "capacity": "50 Pax", "image_url": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80"}
    ]
    return halls_data

@api_router.get("/halls/{hall_id}/slots")
async def get_hall_slots(hall_id: str, date: str, token: str):
    payload = verify_token(token)
    
    slots = ["8-10 AM", "10-12 PM", "1-3 PM", "3-5 PM"]
    slot_status = []
    
    for slot in slots:
        booking = await db.bookings.find_one({
            "hall_id": hall_id,
            "date": date,
            "slot": slot,
            "status": {"$in": ["pending", "approved"]}
        }, {"_id": 0})
        
        blocked = await db.blocked_slots.find_one({
            "hall_id": hall_id,
            "date": date,
            "slot": slot
        }, {"_id": 0})
        
        if blocked:
            slot_status.append({"slot": slot, "status": "blocked", "reason": blocked.get("reason")})
        elif booking:
            slot_status.append({"slot": slot, "status": "booked", "bookedBy": booking.get("employee_name")})
        else:
            slot_status.append({"slot": slot, "status": "available"})
    
    return slot_status

@api_router.post("/bookings")
async def create_booking(booking_data: BookingCreate, token: str, background_tasks: BackgroundTasks):
    payload = verify_token(token)
    emp_id = payload.get("emp_id")
    
    user = await db.users.find_one({"emp_id": emp_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = await db.bookings.find_one({
        "hall_id": booking_data.hall_id,
        "date": booking_data.date,
        "slot": booking_data.slot,
        "status": {"$in": ["pending", "approved"]}
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Slot already booked")
    
    blocked = await db.blocked_slots.find_one({
        "hall_id": booking_data.hall_id,
        "date": booking_data.date,
        "slot": booking_data.slot
    }, {"_id": 0})
    
    if blocked:
        raise HTTPException(status_code=400, detail="Slot is blocked by admin")
    
    booking_id = f"BK-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    booking_doc = {
        "id": booking_id,
        "emp_id": emp_id,
        "employee_name": user["name"],
        "hall_id": booking_data.hall_id,
        "hall_name": booking_data.hall_name,
        "date": booking_data.date,
        "slot": booking_data.slot,
        "purpose": booking_data.purpose,
        "department": booking_data.department,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None
    }
    
    await db.bookings.insert_one(booking_doc)
    
    notif_doc = {
        "id": f"N-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "user_id": emp_id,
        "message": f"Your booking request for {booking_data.hall_name} on {booking_data.date} ({booking_data.slot}) has been submitted.",
        "type": "booking_submitted",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    background_tasks.add_task(
        email_service.send_booking_notification,
        user["email"],
        {
            "hall_name": booking_data.hall_name,
            "date": booking_data.date,
            "slot": booking_data.slot,
            "purpose": booking_data.purpose
        },
        "submitted"
    )
    
    return {"message": "Booking request submitted successfully", "booking_id": booking_id}

@api_router.get("/bookings/my-bookings")
async def get_my_bookings(token: str):
    payload = verify_token(token)
    emp_id = payload.get("emp_id")
    
    bookings = await db.bookings.find({"emp_id": emp_id}, {"_id": 0}).sort("requested_at", -1).to_list(100)
    return bookings

@api_router.get("/notifications/my-notifications")
async def get_my_notifications(token: str):
    payload = verify_token(token)
    emp_id = payload.get("emp_id")
    
    notifications = await db.notifications.find({"user_id": emp_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, token: str):
    payload = verify_token(token)
    
    await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@api_router.get("/admin/bookings/pending")
async def get_pending_bookings(token: str):
    payload = verify_token(token)
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find({"status": "pending"}, {"_id": 0}).sort("requested_at", -1).to_list(100)
    return bookings

@api_router.get("/admin/bookings/all")
async def get_all_bookings(token: str):
    payload = verify_token(token)
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find({}, {"_id": 0}).sort("requested_at", -1).to_list(1000)
    return bookings

@api_router.put("/admin/bookings/{booking_id}/approve")
async def approve_booking(booking_id: str, token: str, background_tasks: BackgroundTasks):
    payload = verify_token(token)
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "approved", "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    notif_doc = {
        "id": f"N-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "user_id": booking["emp_id"],
        "message": f"Your booking for {booking['hall_name']} on {booking['date']} ({booking['slot']}) has been approved.",
        "type": "booking_approved",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    user = await db.users.find_one({"emp_id": booking["emp_id"]}, {"_id": 0})
    if user:
        background_tasks.add_task(
            email_service.send_booking_notification,
            user["email"],
            {
                "hall_name": booking["hall_name"],
                "date": booking["date"],
                "slot": booking["slot"],
                "purpose": booking.get("purpose", "")
            },
            "approved"
        )
    
    return {"message": "Booking approved successfully"}

@api_router.put("/admin/bookings/{booking_id}/reject")
async def reject_booking(booking_id: str, token: str, background_tasks: BackgroundTasks):
    payload = verify_token(token)
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "rejected"}})
    
    notif_doc = {
        "id": f"N-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "user_id": booking["emp_id"],
        "message": f"Your booking for {booking['hall_name']} on {booking['date']} ({booking['slot']}) has been rejected.",
        "type": "booking_rejected",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    user = await db.users.find_one({"emp_id": booking["emp_id"]}, {"_id": 0})
    if user:
        background_tasks.add_task(
            email_service.send_booking_notification,
            user["email"],
            {
                "hall_name": booking["hall_name"],
                "date": booking["date"],
                "slot": booking["slot"],
                "purpose": booking.get("purpose", "")
            },
            "rejected"
        )
    
    return {"message": "Booking rejected successfully"}

@api_router.post("/admin/slots/block")
async def block_slot(block_data: BlockSlot, token: str):
    payload = verify_token(token)
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    block_id = f"BL-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    block_doc = {
        "id": block_id,
        "hall_id": block_data.hall_id,
        "hall_name": block_data.hall_name,
        "date": block_data.date,
        "slot": block_data.slot,
        "reason": block_data.reason,
        "blocked_by": payload.get("emp_id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blocked_slots.insert_one(block_doc)
    
    return {"message": "Slot blocked successfully"}

@api_router.put("/admin/bookings/{booking_id}/modify")
async def modify_booking(booking_id: str, update_data: BookingUpdate, token: str, background_tasks: BackgroundTasks):
    payload = verify_token(token)
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_fields:
        await db.bookings.update_one({"id": booking_id}, {"$set": update_fields})
        
        updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        
        notif_doc = {
            "id": f"N-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "user_id": booking["emp_id"],
            "message": f"Your booking has been modified. New details: {updated_booking['hall_name']} on {updated_booking['date']} ({updated_booking['slot']}).",
            "type": "booking_modified",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif_doc)
        
        user = await db.users.find_one({"emp_id": booking["emp_id"]}, {"_id": 0})
        if user:
            background_tasks.add_task(
                email_service.send_booking_notification,
                user["email"],
                {
                    "hall_name": updated_booking["hall_name"],
                    "date": updated_booking["date"],
                    "slot": updated_booking["slot"],
                    "purpose": updated_booking.get("purpose", "")
                },
                "modified"
            )
    
    return {"message": "Booking modified successfully"}

@api_router.post("/admin/init")
async def init_admin():
    existing = await db.users.find_one({"emp_id": "ADMIN001"}, {"_id": 0})
    if existing:
        return {"message": "Admin already exists"}
    
    admin_doc = {
        "emp_id": "ADMIN001",
        "name": "Admin",
        "email": "admin@hmil.net",
        "password": hash_password("admin123"),
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_doc)
    return {"message": "Admin created successfully", "credentials": {"emp_id": "ADMIN001", "password": "admin123"}}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
