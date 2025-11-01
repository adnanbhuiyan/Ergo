from fastapi import APIRouter 
from .schemas import UserBase, UserSignup, UserLogin

auth_router = APIRouter(
    prefix="/auth"
)

@auth_router.post("/signup")
def create_user(user: UserSignup):
    """
        Signs up a user using Supabase and then stores the user's profile into a database 
    """
    return "<h2>Test User</h2>"


@auth_router.get("/login")
def login_user():
    return

@auth_router.get("/logout")
def logout_user():
    return 
