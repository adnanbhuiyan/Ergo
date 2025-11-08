from fastapi import APIRouter, status, HTTPException, Form, File, UploadFile, Depends, Response
from src.auth.schemas import UserBase, UserSignup, UserLogin, UserLoggedIn
from src.auth.service import signup_user, signin_user, signout_user
from src.auth.dependencies import get_current_user, oauth2_scheme
from typing import Optional
from pydantic import ValidationError

auth_router = APIRouter(
    prefix="/auth"
)

@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    username: str = Form(...),
    position: str = Form(...),
    profile_photo: Optional[UploadFile] = File(None) 
):
    """
        Signs up a user using Supabase and then stores the user's profile into the Supabase userprofile table.
        Returns the user's profile information. 
    """

    #Validate the user form data against the schema for the UserSignup
    try:
        user_signup_data = UserSignup(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            username=username,
            position=position
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=e.errors() 
        )


    complete_profile_data = await signup_user(user_signup_data, profile_photo)
    
    if "error" in complete_profile_data:
        if "User already registered" in complete_profile_data["error"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=complete_profile_data["error"],
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=complete_profile_data["error"],
        ) 

    return complete_profile_data["user_profile"]


@auth_router.post("/login", status_code=status.HTTP_202_ACCEPTED)
def login_user(user: UserLogin):
    """
        Logs in a user using Supabase and returns both the user's profile and their session data which includes their JWT
    """
    user_data = signin_user(user)

    if "error" in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=user_data["error"],
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user_data["data"]

@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(token: str = Depends(oauth2_scheme)):
    """
        Logs out a user using Supabase by invalidating their JWT 
    """
    signout_data = signout_user(token)
    
    if "error" in signout_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=signout_data["error"]
        )

    #Successful logout will return nothing
    return Response(status_code=status.HTTP_204_NO_CONTENT)
