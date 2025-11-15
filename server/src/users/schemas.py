from pydantic import BaseModel, EmailStr
import uuid

class PublicUserProfile(BaseModel):
    id: uuid.UUID
    email: EmailStr 
    first_name: str 
    last_name: str 
    username: str 
    position: str 
    profile_photo: str 
    
    model_config = {
        "from_attributes": True
    }