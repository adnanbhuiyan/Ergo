from pydantic import BaseModel, Field, field_validator
import uuid
from datetime import datetime
from typing import Optional 
from decimal import Decimal

class Project(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=500)
    budget: float = Field(..., ge=0)

class CreateProject(Project):
    pass 

class UpdateProject(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    budget: Optional[float] = Field(None, ge=0)

    @field_validator("*", mode="before")
    def empty_str_to_none(cls, val):
        """
        If an empty string is received for a field, it's converted to None. 
        """
        if val == "":
            return None
        return val

class GetProject(Project):
    id: uuid.UUID
    owner_id: uuid.UUID 
    created_at: datetime 

    class Config:
        from_attributes = True