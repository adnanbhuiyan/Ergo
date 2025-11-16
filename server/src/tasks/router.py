from fastapi import APIRouter, HTTPException, Form, Depends
from fastapi import status as http_status
from src.tasks.schemas import CreateTask, GetTask, UpdateTask
from src.tasks.service import create_task, get_tasks_for_project, get_task, update_task, delete_task, add_dependency, remove_dependency, add_assignment, get_assignments, delete_assignment
from src.auth.dependencies import get_current_user
from gotrue.types import User
from pydantic import ValidationError, BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

tasks_router = APIRouter()

@tasks_router.post("/projects/{project_id}/tasks", status_code=http_status.HTTP_201_CREATED, response_model=GetTask)
def create_new_task(
    project_id: uuid.UUID,
    creator: User = Depends(get_current_user),
    name: str = Form(...),
    description: str = Form(...),
    priority: str = Form(...),
    status: str = Form(...),
    estimated_completion_time: int = Form(...),
    budget: float = Form(...),
    expense: float = Form(...),
    due_date: datetime = Form(...)
):
    """
        Creates a task within the project
    """
    try:
        task_info = CreateTask(
            name=name, description=description, priority=priority, status=status,
            estimated_completion_time=estimated_completion_time,
            budget=budget, expense=expense, due_date=due_date
        )
    except ValidationError as e:
        raise HTTPException(status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors())

    new_task = create_task(task_info, project_id, creator.id)


    if "error" in new_task:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=new_task["error"])
    
    return new_task

@tasks_router.get("/projects/{project_id}/tasks", status_code=http_status.HTTP_200_OK, response_model=List[GetTask])
def get_all_tasks_for_project(
    project_id: uuid.UUID,
    member: User = Depends(get_current_user)
):
    """
        Gets information for all tasks in the project
    """
    tasks = get_tasks_for_project(project_id)
    if isinstance(tasks, dict) and "error" in tasks:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail=tasks["error"])
    return tasks

@tasks_router.get("/tasks/{task_id}", status_code=http_status.HTTP_200_OK, response_model=GetTask)
def get_single_task(
    task_id: uuid.UUID,
    member: User = Depends(get_current_user)
):
    """
        Gets information for a single task 
    """
    task = get_task(task_id)
    if isinstance(task, dict) and "error" in task:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail=task["error"])
    return task

@tasks_router.patch("/tasks/{task_id}", status_code=http_status.HTTP_200_OK, response_model=GetTask)
def update_single_task(
    task_id: uuid.UUID,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    priority: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    estimated_completion_time: Optional[str] = Form(None),
    actual_completion_time: Optional[str] = Form(None),
    budget: Optional[str] = Form(None),
    expense: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    completed_on: Optional[str] = Form(None),
    member: User = Depends(get_current_user)
):
    """
        Updates a task with the new details
    """
    try:
        task_update_info = UpdateTask(
            name=name, description=description, priority=priority, status=status,
            estimated_completion_time=estimated_completion_time,
            actual_completion_time=actual_completion_time,
            budget=budget, expense=expense, due_date=due_date,
            completed_on=completed_on
        )
    except ValidationError as e:
        raise HTTPException(status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors())

    updated_task = update_task(task_id, task_update_info)
    if "error" in updated_task:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=updated_task["error"])
    return updated_task

@tasks_router.delete("/tasks/{task_id}", status_code=http_status.HTTP_200_OK)
def delete_single_task(
    task_id: uuid.UUID,
    member: User = Depends(get_current_user)
):
    """
        Deletes a task
    """
    delete_message = delete_task(task_id)
    if "error" in delete_message:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=delete_message["error"])
    return delete_message


class DependencyRequest(BaseModel):
    """
        Model used when adding a dependency
    """
    depends_on_task_id: uuid.UUID

@tasks_router.post("/tasks/{task_id}/dependencies", status_code=http_status.HTTP_201_CREATED)
def add_task_dependency(
    task_id: uuid.UUID, 
    dependency: DependencyRequest,
    member: User = Depends(get_current_user)
):
    """
        Make a task dependent on another task.
    """
    result = add_dependency(task_id, dependency.depends_on_task_id)
    if "error" in result:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return {"message": "Dependency added successfully"}

@tasks_router.delete("/tasks/{task_id}/dependencies/{depends_on_task_id}", status_code=http_status.HTTP_200_OK)
def remove_task_dependency(
    task_id: uuid.UUID, 
    depends_on_task_id: uuid.UUID,
    member: User = Depends(get_current_user)
):
    """
        Remove a dependency from a task.
    """
    result = remove_dependency(task_id, depends_on_task_id)
    if "error" in result:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=result["error"])
    
    return result


@tasks_router.post("/tasks/{task_id}/assignees", status_code=http_status.HTTP_201_CREATED)
def assign_user_task(
    task_id: uuid.UUID, 
    assignee_id: uuid.UUID,
    member: User = Depends(get_current_user)
):
    """
        Assigns a task to a user in the project
    """
    task_assignment = add_assignment(task_id=task_id, assignee_id=assignee_id)

    if "error" in task_assignment:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=task_assignment["error"])
    
    return task_assignment 


@tasks_router.get("/tasks/{task_id}/assignees", status_code=http_status.HTTP_200_OK)
def get_task_assignees(
    task_id: uuid.UUID, 
    member: User = Depends(get_current_user)
):
    """
        Gets all assignees for a single task 
    """
    task_assignees = get_assignments(task_id=task_id)

    if "error" in task_assignees:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail=task_assignees["error"])
    
    return task_assignees 

@tasks_router.delete("/tasks/{task_id}/assignees/{assignee_id}", status_code=http_status.HTTP_200_OK)
def remove_user_assignment(
    task_id: uuid.UUID, 
    assignee_id: uuid.UUID,
    member: User = Depends(get_current_user)
):
    """
        Unassigns a user from a task 
    """
    delete_response = delete_assignment(task_id=task_id, assignee_id=assignee_id)

    if "error" in delete_response:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=delete_response["error"])
    
    return delete_response