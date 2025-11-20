from fastapi import APIRouter, status, HTTPException, Depends
from src.auth.dependencies import get_current_user
from gotrue.types import User
from src.users.service import search_ergo_users
from src.users.schemas import PublicUserProfile
import uuid 

users_router = APIRouter(
    prefix="/users"
)

@users_router.get("", status_code=status.HTTP_200_OK, response_model=list[PublicUserProfile])
def find_ergo_user(
    user_query: str,
    user: User = Depends(get_current_user)
):
    """
        Find other Ergo users based on their email or username 
    """
    user_list = search_ergo_users(query_term=user_query, user_id=user.id)

    if "error" in user_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=user_list["error"]
        )
    
    return user_list 



