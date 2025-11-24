from src.database import supabase
import uuid 

def search_ergo_users(query_term: str, user_id: uuid.UUID):
    """
        Queries the userprofile table by name or email to find users 
    """
    try:
        user_response = ( 
            supabase.table("userprofile")
            .select("*") 
            .or_(f"email.ilike.%{query_term}%, username.ilike.%{query_term}%")
            .neq("id", user_id)
            .execute()
        )       
        return user_response.data 
    
    except Exception as e:
        return {"error": str(e)}
    

