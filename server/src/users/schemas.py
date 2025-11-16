from pydantic import BaseModel, EmailStr
import uuid

class PublicUserProfile(BaseModel):
    """
        The user profile which is viewable by other users 
    """
    id: uuid.UUID
    email: EmailStr 
    first_name: str 
    last_name: str 
    username: str 
    position: str 
    profile_photo_url: str 
    
    model_config = {
        "from_attributes": True
    }