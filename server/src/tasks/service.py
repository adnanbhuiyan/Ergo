from src.database import supabase
from src.tasks.schemas import CreateTask, UpdateTask
from fastapi.encoders import jsonable_encoder
from datetime import timedelta
import uuid

def create_task(task_info: CreateTask, project_id: uuid.UUID, creator_id: uuid.UUID):
    """Creates a new task for a given project and user."""
    try:
        new_task = task_info.model_dump()
        new_task["project_id"] = str(project_id)
        new_task["created_by"] = str(creator_id)

        response = supabase.table("tasks").insert(jsonable_encoder(new_task)).execute()
        return response.data[0]
    except Exception as e:
        return {"error": str(e)}

def get_tasks_for_project(project_id: uuid.UUID):
    """Retrieves all tasks associated with a specific project."""
    try:
        response = supabase.table("tasks").select("*").eq("project_id", str(project_id)).execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}

def get_task(task_id: uuid.UUID):
    """Retrieves a single task by its ID."""
    try:
        response = supabase.table("tasks").select("*").eq("id", str(task_id)).single().execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}

def update_task(task_id: uuid.UUID, task_update: UpdateTask):
    """Updates a task's information."""
    try:

        old_task = get_task(task_id)
        print(old_task)
        update_data = task_update.model_dump(exclude_unset=True)
        if not update_data:
            return old_task
        print(update_data)
        task_info = {}
        for key, value in update_data.items():
            if value is not None:
                task_info[key] = value 
            else: 
                task_info[key] = old_task[key]

        response = supabase.table("tasks").update(task_info).eq("id", str(task_id)).execute()
        
        if not response.data:
            return {"error": "Task not found"}
            
        return response.data[0]
    except Exception as e:
        return {"error": str(e)}

def delete_task(task_id: uuid.UUID):
    """Deletes a task from the database."""
    try:
        supabase.table("tasks").delete().eq("id", str(task_id)).execute()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        return {"error": str(e)}