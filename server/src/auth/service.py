from fastapi import HTTPException
from src.database import supabase
from src.auth.schemas import UserBase, UserSignup, UserLogin, UserLoggedIn
from supabase_auth.errors import AuthApiError

def signup_user(user: UserSignup):
    """
        Signs up a user through Supabase if an account with their email does not exist and then adds that user to the userprofile table
    """
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
    

def signin_user(user: UserLogin):
    """
        Signs in a user through Supabase and returns their user profile and session data which includes their JWT
    """
    try:
        response = supabase.auth.sign_in_with_password(
            {
                "email": user.email,
                "password": user.password,
            }
        )

        user_id = response.user.id 

        user_response = supabase.table("userprofile").select("*").eq("id", user_id).single().execute()


        response_data = {
            "session_data": response.session, 
            "user_profile": user_response.data
        }

        return {"data": response_data}
    
    except AuthApiError as e:
        return {"error": e.message}

    except Exception as e:
        return {"error": str(e)}