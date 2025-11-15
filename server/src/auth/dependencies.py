from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.database import supabase 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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

        return user 
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
            headers={"WWW-Authenticate": "Bearer"}
        )
