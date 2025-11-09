from fastapi import APIRouter, status, HTTPException, Form, File, UploadFile, Depends, Response
from src.projects.schemas import CreateProject, GetProject, UpdateProject
from src.projects.service import create_project, get_project, update_project, delete_project
from src.auth.dependencies import get_current_user
from decimal import Decimal
from gotrue.types import User
from datetime import datetime
from pydantic import ValidationError
from typing import Optional
import uuid

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
        ) 
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=e.errors() 
        )
    
    #owner_id=owner.id
    created_project = create_project(proj_info=project_info, owner_id=uuid.UUID("6e4fbdc0-2363-4115-a44e-039ab9fc966e"))

    if "error" in created_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=created_project["error"]
        )
    
    return created_project

@projects_router.get("/{proj_id}", status_code=status.HTTP_200_OK, response_model=GetProject)
def get_user_project(proj_id: uuid.UUID):
    user_project = get_project(proj_id)

    if "error" in user_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=user_project["error"]
        )
    
    return user_project 

@projects_router.put("/{proj_id}", status_code=status.HTTP_200_OK, response_model=GetProject)
def update_user_project(
    proj_id: uuid.UUID,
    name: Optional[str] = Form(None), 
    description: Optional[str] = Form(None),
    budget: Optional[str] = Form(None)
):

    try:
        project_info = UpdateProject(
            name=name, 
            description=description,
            budget=budget,
        ) 
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=e.errors() 
        )

    updated_project = update_project(proj_id, project_info)


    if "error" in updated_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=updated_project["error"]
        )
    
    return updated_project


@projects_router.delete("/{proj_id}", status_code=status.HTTP_200_OK)
def delete_user_project(proj_id: uuid.UUID):
    delete_message = delete_project(proj_id)

    if "error" in delete_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=delete_message["error"]
        )
    
    return delete_message