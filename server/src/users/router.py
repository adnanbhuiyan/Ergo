from fastapi import APIRouter, status, HTTPException, Depends
from src.auth.dependencies import get_current_user
from gotrue.types import User

users_router = APIRouter()

@users_router.get("users/{user_query}", status_code=status.HTTP_200_OK)
def find_ergo_user(
    user_query: str,
    user: User = Depends(get_current_user)
):
    """
        Find other Ergo users based on their email or username to add 
        to the project
    """
    pass 



@users_router.get("/tasks/{task_id}/users", status_code=status.HTTP_200_OK)
def get_all_project_members(
    task_id: str, 
    user: User = Depends(get_current_user)
):
    """
        Get all members in the project 
    """
    pass 

@users_router.get("/tasks/{task_id}/users/{user_query}", status_code=status.HTTP_200_OK)
def get_project_member(
    task_id: str, 
    user_query: str,
    user: User = Depends(get_current_user)
):
    """
        Find members in the project based on their email or username to assign to a task
    """
    pass 
