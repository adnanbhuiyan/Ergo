from src.database import supabase
from src.projects.schemas import CreateProject, UpdateProject
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
    try:
        response = supabase.table("projects").select("*").eq("id", proj_id).single().execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}
    


def update_project(proj_id: uuid.UUID, upd_proj: UpdateProject):
    try:
        old_project = get_project(proj_id)
        print(old_project)
        upd_project = upd_proj.model_dump(exclude_unset=True)
        print(upd_project)
        project_info = {}
        for key, value in upd_project.items():
            if value is not None:
                project_info[key] = value 
            else: 
                project_info[key] = old_project[key]
                
        update = supabase.table("projects").update(project_info).eq("id", proj_id).execute()
        return update.data[0]
    except Exception as e:
        return {"error": str(e)}

def delete_project(proj_id: uuid.UUID):
    try:
        response = supabase.table("projects").delete().eq("id", proj_id).execute()
        return {"message": "Project Deleted Successfully"}
    except Exception as e:
        return {"error": str(e)}

def get_all_projects(owner_id: uuid.UUID):
    try:
        response = supabase.table("projects").select("*").eq("owner_id", str(owner_id)).execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}