from pydantic import BaseModel, Field, field_validator
import uuid
from datetime import datetime
from typing import Optional, List

class TaskDependencyRead(BaseModel):
    """
        A task model for representing a dependency link.
    """
    id: uuid.UUID
    name: str
    status: str

    model_config = {
        "from_attributes": True
    }


class TaskBase(BaseModel):
    """
        The base task model
    """
    name: str = Field(..., min_length=3, max_length=150)
    description: str
    priority: str
    status: str
    budget: float = Field(..., ge=0)
    expense: float = Field(..., ge=0)
    due_date: datetime

class CreateTask(TaskBase):
    """
        The task model used when creating a new task
    """
    estimated_completion_time: int = Field(..., ge=0, description="Total estimated time in hours")

class UpdateTask(BaseModel):
    """
        The task model used when updating a task (all fields are optional)
    """
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_completion_time: Optional[int] = Field(None, ge=0, description="Total estimated time in hours")
    budget: Optional[float] = Field(None, ge=0)
    expense: Optional[float] = Field(None, ge=0)
    due_date: Optional[datetime] = None
    completed_on: Optional[datetime] = None
    actual_completion_time_hours: Optional[int] = Field(None, ge=0, description="Total actual time in hours")

    @field_validator("*", mode="before")
    def empty_str_to_none(cls, val):
        if val == "":
            return None
        return val

class GetTask(TaskBase):
    """
        The task model used when fetching a task's information
    """
    id: uuid.UUID
    project_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    estimated_completion_time: Optional[int] = None
    actual_completion_time: Optional[int] = None
    completed_on: Optional[datetime] = None
    
    depends_on: List[TaskDependencyRead] = []  
    blocking: List[TaskDependencyRead] = []    

    model_config = {
        "from_attributes": True
    }