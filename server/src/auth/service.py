from fastapi import UploadFile
from src.database import supabase
from src.auth.schemas import UserBase, UserSignup, UserLogin, UserLoggedIn
from supabase_auth.errors import AuthApiError
from typing import Optional

async def signup_user(user: UserSignup, profile_photo: Optional[UploadFile]):
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
            print(user)
            user_profile = user.model_dump(exclude={"password"})
            user_profile["id"] = response.user.id
            profile_photo_url = supabase.storage.from_("ErgoProject").get_public_url("user_profile_pictures/default.png")

            if profile_photo:
                try:
                    file_ext = profile_photo.filename.split(".")[-1]
                    photo_path = f"user_profile_pictures/{response.user.id}.{file_ext}"
                    photo_contents = await profile_photo.read()

                    supabase.storage.from_("ErgoProject").upload(
                        path=photo_path,
                        file=photo_contents,
                        file_options={"content-type": profile_photo.content_type, "upsert": "true"}
                    )

                    profile_photo_url = supabase.storage.from_("ErgoProject").get_public_url(photo_path)
                except Exception as e:
                    return {"error": str(e)}

            user_profile["profile_photo_url"] = profile_photo_url 
            print(user_profile)
            user_profile_response = supabase.table("userprofile").insert(user_profile).execute()
            return {"message": "User Signed Up Successfully", "user_profile": user_profile_response.data[0]}

        if response.user and not response.session:
             return {"error": "User already registered. Please try logging in instead."}

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


        print(response_data)

        return {"data": response_data}
    
    except AuthApiError as e:
        return {"error": e.message} 

    except Exception as e:
        return {"error": str(e)}
    
def signout_user(jwt: str):
    """
        Signs out a user by invalidating their JWT
    """

    try: 
        supabase.auth.sign_out(jwt)
        return {"message": "User signed out"}
    except Exception as e:
        return {"error": str(e)}