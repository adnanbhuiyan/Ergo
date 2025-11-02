from pydantic import BaseModel, EmailStr, field_validator
import re
import uuid


class UserBase(BaseModel):
    """
        Base model for the user
    """
    email: EmailStr 
    first_name: str 
    last_name: str 
    username: str 
    position: str 

class UserSignup(UserBase):
    """
        The model used when the user is signing up (includes password)
    """
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
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "testuser@gmail.com",
                    "first_name": "Joe",
                    "last_name": "Sanchez",
                    "username": "TestUser",
                    "position": "CDAIO",
                    "password": "TestPass123$"
                }
            ]
        }
    }    


class UserLogin(BaseModel):
    """
        The model that is used when the user is logging in (only contains email and password)
    """
    email: EmailStr
    password: str 

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "testuser@gmail.com",
                    "password": "TestPass123$"
                }
            ]
        }
    }    

class UserLoggedIn(UserBase):
    id: uuid.UUID


