from src.database import supabase
from src.projects.schemas import CreateProject, UpdateProject, AddProjectMember
import uuid
from datetime import datetime

def create_project(db, proj_info: CreateProject, owner_id: uuid.UUID):
    """
        Creates a project using the user's inputted project information
    """
    try: 
        new_proj = proj_info.model_dump()
        new_proj["owner_id"] = str(owner_id)
        response = db.from_("projects").insert(new_proj).execute()
        return response.data[0]
    except Exception as e:
        return {"error": str(e)}


def get_project(db, proj_id: uuid.UUID):
    """
        Gets a specific user project information
    """
    try:
        response = db.from_("projects").select("*").eq("id", proj_id).single().execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}
    


def update_project(db, proj_id: uuid.UUID, upd_proj: UpdateProject):
    """
        Updates a specific project's information
    """
    try:
        upd_project = upd_proj.model_dump(exclude_unset=True)
        
        project_info = {}
        for key, value in upd_project.items():
            if isinstance(value, datetime):
                project_info[key] = value.isoformat()
            else:
                project_info[key] = value 
        
        update = db.from_("projects").update(project_info).eq("id", proj_id).execute()
        
        if not update.data:
            return {"error": "Project not found or update failed"}

        return update.data[0]
    except Exception as e:
        return {"error": str(e)}

def delete_project(db, proj_id: uuid.UUID):
    """
        Deletes a project 
    """
    try:
        response = db.from_("projects").delete().eq("id", proj_id).execute()
        return {"message": "Project Deleted Successfully"}
    except Exception as e:
        return {"error": str(e)}

def get_all_projects(db, owner_id: uuid.UUID):
    """
        Gets all projects a user is part of
    """
    try:
        response = db.from_("projects").select("*").eq("owner_id", str(owner_id)).execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}
    
def add_member(db, proj_id: uuid.UUID, member_to_add: AddProjectMember):
    """
        Add a user to a project
    """
    try:
        member_info = member_to_add.model_dump()
        member_info["user_id"] = str(member_info["user_id"])
        member_info["project_id"] = str(proj_id) 
        add_response = db.from_("project_members").insert(member_info).execute()
        return add_response.data 
    except Exception as e:
        return {"error": str(e)}
    
def delete_member(db, proj_id: uuid.UUID, member_id: uuid.UUID):
    """
        Removes a user from a project
    """
    try: 
        remove_response = (
            db.from_("project_members")
                    .delete()
                    .eq("project_id", proj_id)
                    .eq("user_id", member_id)
                    .execute()
        )
        return {"message": "User removed from project"}
    except Exception as e:
        return {"error": str(e)}

def all_project_members(db, proj_id: uuid.UUID):
    """
        Gets all members in a project
    """
    try: 
        #Performs a join with the userprofile table to get the user profile information 
        all_response = (
            db.from_("project_members")
                    .select("role, user:userprofile(*)")
                    .eq("project_id", proj_id)
                    .execute()
        )
        return all_response.data 

    except Exception as e:
        return {"error": str(e)}   