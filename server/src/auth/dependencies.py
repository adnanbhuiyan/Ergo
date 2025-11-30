from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.database import supabase 
from gotrue.types import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

#AuthContext class that stores the user JWT and a secure RESTful API for the Supabase PostgreSQL database
class AuthContext:
    def __init__(self, user: User, token: str):
        self.user = user
        self.token = token
        self.db = supabase.postgrest.auth(token)

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
        Dependency to get the current user from the JWT and verify it with Supabase.
        Returns the user object.
        This is used to create protected backend routes. 
    """
    try:
        #Gets the user based on their JWT 
        response = supabase.auth.get_user(token)
        user = response.user 

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )

        return AuthContext(user=user, token=token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Token {e.message}",
            headers={"WWW-Authenticate": "Bearer"}
        )
