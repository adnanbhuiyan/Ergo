from fastapi import HTTPException
from src.database import supabase
from src.auth.schemas import UserBase, UserSignup, UserLogin, UserLoggedIn
from supabase_auth.errors import AuthApiError

def signup_user(user: UserSignup):
    try:
        response = supabase.auth.sign_up(
            {
                "email": user.email,
                "password": user.password 
            }
        )
 
        if response.user and response.session:
            user_profile = user.model_dump(exclude={"password"})
            user_profile["id"] = response.user.id
            print(user_profile)
            user_profile_response = supabase.table("userprofile").insert(user_profile).execute()
            return {"message": "User Signed Up Successfully", "user_profile": user_profile_response.data[0]}

    except AuthApiError as e:
        return {"error": e.message}

    except Exception as e:
        return {"error": str(e)}
    

