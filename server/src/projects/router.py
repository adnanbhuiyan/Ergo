from fastapi import APIRouter, status, HTTPException, Form, File, UploadFile, Depends, Response
from src.projects.schemas import CreateProject 
from src.auth.dependencies import get_current_user
from decimal import Decimal
from gotrue.types import User
from datetime import datetime

projects_router = APIRouter(
    prefix="/projects"
)

@projects_router.post("", status_code=status.HTTP_201_CREATED)
def create_new_project(
    owner: User = Depends(get_current_user),
    name: str = Form(...),
    description: str = Form(...),
    budget: Decimal = Form(...)
):
    project_info = CreateProject(
        name=name, 
        description=description,
        budget=budget,
        owner_id=owner.id,
        created_at=datetime.now().timestamp()
    ) 
