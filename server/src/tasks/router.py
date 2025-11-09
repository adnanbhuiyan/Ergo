from fastapi import APIRouter, HTTPException, Form, Depends
from fastapi import status as http_status
from src.tasks.schemas import CreateTask, GetTask, UpdateTask
from src.tasks.service import create_task, get_tasks_for_project, get_task, update_task, delete_task
from src.auth.dependencies import get_current_user
from gotrue.types import User
from pydantic import ValidationError
from typing import Optional, List
from datetime import datetime
import uuid

tasks_router = APIRouter()

@tasks_router.post("/projects/{project_id}/tasks", status_code=http_status.HTTP_201_CREATED, response_model=GetTask)
def create_new_task(
    project_id: uuid.UUID,
    # creator: User = Depends(get_current_user),
    name: str = Form(...),
    description: str = Form(...),
    priority: str = Form(...),
    status: str = Form(...),
    estimated_completion_time_hours: float = Form(...),
    budget: float = Form(...),
    expense: float = Form(...),
    due_date: datetime = Form(...)
):
    try:
        task_info = CreateTask(
            name=name, description=description, priority=priority, status=status,
            estimated_completion_time_hours=estimated_completion_time_hours,
            budget=budget, expense=expense, due_date=due_date
        )
    except ValidationError as e:
        raise HTTPException(status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors())

    creator_id = uuid.UUID("6e4fbdc0-2363-4115-a44e-039ab9fc966e") 
    new_task = create_task(task_info, project_id, creator_id)

    if "error" in new_task:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=new_task["error"])
    
    return new_task

@tasks_router.get("/projects/{project_id}/tasks", status_code=http_status.HTTP_200_OK, response_model=List[GetTask])
def get_all_tasks_for_project(project_id: uuid.UUID):
    tasks = get_tasks_for_project(project_id)
    if isinstance(tasks, dict) and "error" in tasks:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail=tasks["error"])
    return tasks

@tasks_router.get("/tasks/{task_id}", status_code=http_status.HTTP_200_OK, response_model=GetTask)
def get_single_task(task_id: uuid.UUID):
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
    estimated_completion_time_hours: Optional[str] = Form(None),
    actual_completion_time_hours: Optional[str] = Form(None),
    budget: Optional[str] = Form(None),
    expense: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    completed_on: Optional[str] = Form(None)
):
    try:
        task_update_info = UpdateTask(
            name=name, description=description, priority=priority, status=status,
            estimated_completion_time_hours=estimated_completion_time_hours,
            actual_completion_time_hours=actual_completion_time_hours,
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
def delete_single_task(task_id: uuid.UUID):
    delete_message = delete_task(task_id)
    if "error" in delete_message:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=delete_message["error"])
    return delete_message