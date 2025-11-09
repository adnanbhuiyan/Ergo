from src.database import supabase
from src.projects.schemas import CreateProject 
import uuid

def create_project(proj_info: CreateProject, owner_id: uuid.UUID):
    try: 
        new_proj = proj_info.model_dump()
        new_proj["owner_id"] = str(owner_id)
        response = supabase.table("projects").insert(new_proj).execute()
        return response.data[0]
    except Exception as e:
        return {"error": str(e)}


def get_project(proj_id: uuid.UUID):
    pass 

def update_proj(proj_id: uuid.UUID):
    pass 

def delete_proj(proj_id: uuid.UUID):
    pass 