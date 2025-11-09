from fastapi import Field
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Optional 
from decimal import Decimal

class Project(BaseModel):
    name: str 
    description: str = Field(None, max_length=500)
    budget: Decimal 
    owner_id: uuid.UUID 
    created_at: datetime 

class CreateProject(Project):
    pass 

class UpdateProject(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    budget: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


