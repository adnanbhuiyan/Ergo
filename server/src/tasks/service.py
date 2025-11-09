from src.database import supabase
from src.tasks.schemas import CreateTask, UpdateTask
from datetime import timedelta
import uuid

def create_task(task_info: CreateTask, project_id: uuid.UUID, creator_id: uuid.UUID):
    """Creates a new task for a given project and user."""
    try:
        new_task = task_info.model_dump()
        new_task["project_id"] = str(project_id)
        new_task["created_by"] = str(creator_id)

        hours = new_task.pop("estimated_completion_time_hours")
        td = timedelta(hours=hours)
        new_task["estimated_completion_time"] = str(td)

        response = supabase.table("tasks").insert(new_task).execute()
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
    """Partially updates a task's information."""
    try:
        update_data = task_update.model_dump(exclude_unset=True)

        if not update_data:
            return get_task(task_id)

        if "estimated_completion_time_hours" in update_data:
            hours = update_data.pop("estimated_completion_time_hours")
            td = timedelta(hours=hours) if hours is not None else None
            update_data["estimated_completion_time"] = str(td) if td is not None else None
        
        if "actual_completion_time_hours" in update_data:
            hours = update_data.pop("actual_completion_time_hours")
            td = timedelta(hours=hours) if hours is not None else None
            update_data["actual_completion_time"] = str(td) if td is not None else None

        response = supabase.table("tasks").update(update_data).eq("id", str(task_id)).execute()
        
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