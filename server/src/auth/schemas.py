from pydantic import BaseModel, EmailStr, field_validator
import re
import uuid


class UserBase(BaseModel):
    email: EmailStr
    first_name: str 
    last_name: str 
    username: str 
    position: str 

class UserSignup(UserBase):
    password: str 
    @field_validator("password")
    def password_validator(cls, value: str) -> str:
        # Check for minimum length of 8
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        # Check for at least one uppercase letter
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        
        # Check for at least one lowercase letter
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
            
        # Check for at least one number
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")
            
        # Check for at least one special character
        if not re.search(r"[@$!%*?&]", value):
            raise ValueError("Password must contain at least one special character from the following: @$!%*?&")
            
        return value

class UserLogin(BaseModel):
    email: EmailStr
    password: str 

class UserLoggedIn(UserBase):
    id: uuid.UUID


