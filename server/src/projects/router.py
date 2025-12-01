from fastapi import APIRouter, status, HTTPException, Form, Depends
from src.projects.schemas import CreateProject, GetProject, UpdateProject, ProjectMember, AddProjectMember
from src.projects.service import create_project, get_project, update_project, delete_project, get_all_projects, add_member, delete_member, all_project_members
from src.auth.dependencies import get_current_user, AuthContext
from gotrue.types import User
from pydantic import ValidationError
from typing import Optional
import uuid
from datetime import datetime

projects_router = APIRouter(
    prefix="/projects"
)

@projects_router.post("", status_code=status.HTTP_201_CREATED)
def create_new_project(
    ctx: AuthContext = Depends(get_current_user),
    name: str = Form(...),
    description: str = Form(...),
    budget: float = Form(...)
):
    """
        Create new project and assign creator as Owner
    """
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
    
    created_project = create_project(db=ctx.db, proj_info=project_info, owner_id=ctx.user.id)

    if "error" in created_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=created_project["error"]
        )
    
    try:
        owner_member = AddProjectMember(user_id=ctx.user.id, role="Owner")
        add_member(db=ctx.db, proj_id=created_project["id"], member_to_add=owner_member)
    except Exception as e:
        print(f"Error adding owner as member: {e}")
    
    return created_project

@projects_router.get("", status_code=status.HTTP_200_OK)
def get_all_user_projects(ctx: AuthContext = Depends(get_current_user)):
    """
        Get all user projects
    """
    user_projects = get_all_projects(ctx.db, ctx.user.id)
    
    if "error" in user_projects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=user_projects["error"]
        )
    
    return user_projects

@projects_router.get("/{proj_id}", status_code=status.HTTP_200_OK, response_model=GetProject)
def get_user_project(
    proj_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user)
):
    """
        Get a specific user project
    """
    user_project = get_project(ctx.db, proj_id)

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
    budget: Optional[str] = Form(None),
    completed_at: Optional[str] = Form(None),
    ctx: AuthContext = Depends(get_current_user)
):
    """
        Update a specific user project
    """
    try:
        project_info = UpdateProject(
            name=name, 
            description=description,
            budget=budget,
            completed_at=completed_at
        ) 
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=e.errors() 
        )

    updated_project = update_project(ctx.db, proj_id, project_info)


    if "error" in updated_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=updated_project["error"]
        )
    
    return updated_project


@projects_router.delete("/{proj_id}", status_code=status.HTTP_200_OK)
def delete_user_project(
    proj_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user)
):
    """
        Delete a specific user project
    """
    delete_message = delete_project(ctx.db, proj_id)

    if "error" in delete_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=delete_message["error"]
        )
    
    return delete_message


@projects_router.post("/{proj_id}/members", status_code=status.HTTP_201_CREATED)
def add_project_member(
    proj_id: uuid.UUID, 
    member_to_add: AddProjectMember,
    ctx: AuthContext = Depends(get_current_user)
):
    """
        Adds a user to a project 
    """
    add_message =  add_member(db=ctx.db, proj_id=proj_id, member_to_add=member_to_add)

    if "error" in add_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=add_message["error"]
        )
    
    return add_message


@projects_router.delete("/{proj_id}/members/{member_id}", status_code=status.HTTP_200_OK)
def remove_project_member(
    proj_id: uuid.UUID, 
    member_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user)
):
    """
        Removes a user from a project
    """
    delete_message = delete_member(db=ctx.db, proj_id=proj_id, member_id=member_id)

    if "error" in delete_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=delete_message["error"]
        )
    
    return delete_message


@projects_router.get("/{proj_id}/members", status_code=status.HTTP_200_OK, response_model=list[ProjectMember])
def get_project_members(
    proj_id: uuid.UUID,
    ctx: AuthContext = Depends(get_current_user)
):
    """
        Gets all members in a project and their user profiles 
    """
    project_members = all_project_members(db=ctx.db, proj_id=proj_id) 

    if "error" in project_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=project_members["error"]
        )
    print(project_members)

    return project_members
