from pydantic import BaseModel, Field, field_validator
import uuid
from datetime import datetime
from typing import Optional 
from src.users.schemas import PublicUserProfile

class Project(BaseModel):
    """
        Base Project model
    """
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=500)
    budget: float = Field(..., ge=0)

class CreateProject(Project):
    """
        The create project model follows the same model as the base task model
    """
    pass 

class UpdateProject(BaseModel):
    """
        The update project model which contains optional fields
    """
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    budget: Optional[float] = Field(None, ge=0)
    completed_at: Optional[datetime] = None
    
    @field_validator("*", mode="before")
    def empty_str_to_none(cls, val):
        """
        If an empty string is received for a field, it's converted to None. 
        """
        if val == "":
            return None
        return val

class GetProject(Project):
    """
        The model used when fetching project details
    """
    id: uuid.UUID
    owner_id: uuid.UUID 
    created_at: datetime 
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectMember(BaseModel):
    """
        The model that is used when displaying project member information
    """
    user: PublicUserProfile
    role: str

    model_config = {
        "from_attributes": True
    }

class AddProjectMember(BaseModel):
    """
        The model that is used when adding a member to a project 
    """
    user_id: uuid.UUID 
    role: str 