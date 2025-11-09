from fastapi import APIRouter, status, HTTPException, Form, File, UploadFile, Depends, Response
from src.projects.schemas import CreateProject 
from src.projects.service import create_project
from src.auth.dependencies import get_current_user
from decimal import Decimal
from gotrue.types import User
from datetime import datetime
from pydantic import ValidationError
from uuid import UUID

projects_router = APIRouter(
    prefix="/projects"
)

@projects_router.post("", status_code=status.HTTP_201_CREATED)
def create_new_project(
    #owner: User = Depends(get_current_user),
    name: str = Form(...),
    description: str = Form(...),
    budget: float = Form(...)
):
    try:
        project_info = CreateProject(
            name=name, 
            description=description,
            budget=budget,
            #created_at=datetime.now().timestamp()
        ) 
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=e.errors() 
        )
    
    #owner_id=owner.id
    created_project = create_project(proj_info=project_info, owner_id=UUID("tempUID"))

    if "error" in created_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=created_project["error"]
        )
    
    return created_project