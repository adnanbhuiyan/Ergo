from fastapi import APIRouter, status, HTTPException
from src.auth.schemas import UserBase, UserSignup, UserLogin, UserLoggedIn
from src.auth.service import signup_user, signin_user

auth_router = APIRouter(
    prefix="/auth"
)

@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
def create_user(user: UserSignup):
    """
        Signs up a user using Supabase and then stores the user's profile into a database 
    """
    user_data = signup_user(user)
    if "error" in user_data:
        if "User already registered" in user_data["error"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=user_data["error"],
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=user_data["error"],
        ) 

    return user_data["user_profile"]


@auth_router.post("/login")
def login_user(user: UserLogin):
    user_data = signin_user(user)

    if "error" in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=user_data["error"],
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user_data["data"]

@auth_router.get("/logout")
def logout_user():
    return 
