from pydantic import BaseModel, Field, field_validator, computed_field
import uuid
from datetime import datetime, timedelta
from typing import Optional

class TaskBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: str
    priority: str
    status: str
    budget: float = Field(..., ge=0)
    expense: float = Field(..., ge=0)
    due_date: datetime

class CreateTask(TaskBase):
    estimated_completion_time_hours: float = Field(..., ge=0, description="Total estimated time in hours")

class UpdateTask(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_completion_time_hours: Optional[float] = Field(None, ge=0, description="Total estimated time in hours")
    budget: Optional[float] = Field(None, ge=0)
    expense: Optional[float] = Field(None, ge=0)
    due_date: Optional[datetime] = None
    completed_on: Optional[datetime] = None
    actual_completion_time_hours: Optional[float] = Field(None, ge=0, description="Total actual time in hours")

    @field_validator("*", mode="before")
    def empty_str_to_none(cls, val):
        if val == "":
            return None
        return val

class GetTask(TaskBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    estimated_completion_time: Optional[timedelta] = None
    actual_completion_time: Optional[timedelta] = None
    completed_on: Optional[datetime] = None

    @computed_field
    @property
    def estimated_completion_time_hours(self) -> Optional[float]:
        if self.estimated_completion_time:
            return self.estimated_completion_time.total_seconds() / 3600
        return None

    model_config = {
        "from_attributes": True
    }