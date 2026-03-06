from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime

class UserCreate(BaseModel):
    emp_id: str
    email: EmailStr

class UserLogin(BaseModel):
    emp_id: str
    password: str

class SetPassword(BaseModel):
    token: str
    password: str
    name: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    emp_id: str
    name: str
    email: str
    role: Literal["user", "admin"] = "user"
    created_at: str

class BookingCreate(BaseModel):
    hall_id: str
    hall_name: str
    date: str
    slot: str
    purpose: str
    department: str

class BookingUpdate(BaseModel):
    hall_id: Optional[str] = None
    hall_name: Optional[str] = None
    date: Optional[str] = None
    slot: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    emp_id: str
    employee_name: str
    hall_id: str
    hall_name: str
    date: str
    slot: str
    purpose: str
    department: str
    status: Literal["pending", "approved", "rejected", "cancelled"]
    requested_at: str
    approved_at: Optional[str] = None

class BlockSlot(BaseModel):
    hall_id: str
    hall_name: str
    date: str
    slot: str
    reason: Optional[str] = None

class Hall(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    capacity: str
    image_url: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    message: str
    type: str
    read: bool
    created_at: str