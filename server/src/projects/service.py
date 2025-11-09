from src.database import supabase
from src.projects.schemas import CreateProject 
import uuid

def create_project(proj_info: CreateProject):
    try: 
        response = supabase.table("projects").insert(proj_info).execute()
        return {"message": "New Project Created"}
    except Exception as e:
        return {"error": str(e)}


def get_project(proj_id: uuid.UUID):
    pass 

def update_proj(proj_id: uuid.UUID):
    pass 

def delete_proj(proj_id: uuid.UUID):
    pass 