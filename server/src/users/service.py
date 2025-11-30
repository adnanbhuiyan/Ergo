from src.database import supabase
import uuid 

def search_ergo_users(db, query_term: str, user_id: uuid.UUID):
    """
        Queries the userprofile table by name or email to find users 
    """

    print(query_term)
    try:
        user_response = ( 
            db.from_("userprofile")
            .select("*") 
            .or_(f"email.ilike.%{query_term}%,username.ilike.%{query_term}%")
            .neq("id", user_id)
            .execute()
        )       
        print("User Response: ", user_response)  
        return user_response.data 
    
    except Exception as e:
        return {"error": str(e)}
    

