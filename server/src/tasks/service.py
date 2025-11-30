from src.database import supabase
from src.tasks.schemas import CreateTask, UpdateTask
from fastapi.encoders import jsonable_encoder
import uuid

def _get_dependency_details(db, task_id: uuid.UUID):
    """
        Helper function to fetch 'depends_on' and 'blocking' tasks for a given task.
    """
    try:
        depends_on_res = db.from_("task_dependencies").select("depends_on:tasks!depends_on_task_id(id, name, status)").eq("task_id", str(task_id)).execute()
        
        blocking_res = db.from_("task_dependencies").select("blocking:tasks!task_id(id, name, status)").eq("depends_on_task_id", str(task_id)).execute()

        depends_on_list = [item["depends_on"] for item in depends_on_res.data]
        blocking_list = [item["blocking"] for item in blocking_res.data]
        
        return depends_on_list, blocking_list
    except Exception:
        return [], []



def create_task(db, task_info: CreateTask, project_id: uuid.UUID, creator_id: uuid.UUID):
    """
        Creates a new task for a given project and user.
    """
    try:
        new_task_data = task_info.model_dump()
        new_task_data["project_id"] = str(project_id)
        new_task_data["created_by"] = str(creator_id)

        response = db.from_("tasks").insert(jsonable_encoder(new_task_data)).execute()
        return response.data[0]
    except Exception as e:
        return {"error": str(e)}

def get_tasks_for_project(db, project_id: uuid.UUID):
    """
        Retrieves all tasks for a project, including their dependency details.
    """
    try:
        response = db.from_("tasks").select("*").eq("project_id", str(project_id)).execute()
        tasks = response.data

        for task in tasks:
            task["depends_on"], task["blocking"] = _get_dependency_details(db, task["id"])
        return tasks
    except Exception as e:
        return {"error": str(e)}

def get_task(db, task_id: uuid.UUID):
    """
        Retrieves a single task by its ID, including its dependency details.
    """
    try:
        response = db.from_("tasks").select("*").eq("id", str(task_id)).single().execute()
        task = response.data

        if task:
            task["depends_on"], task["blocking"] = _get_dependency_details(db, task_id)
        return task
    except Exception as e:
        return {"error": str(e)}

def update_task(db, task_id: uuid.UUID, task_update: UpdateTask):
    """
        Updates a task's information with the new user provided details.
    """
    try:

        old_task = get_task(db, task_id)

        update_data = task_update.model_dump(exclude_unset=True)
        if not update_data:
            return old_task

        task_info = {}
        for key, value in update_data.items():
            if value is not None:
                task_info[key] = value 
            else: 
                task_info[key] = old_task[key]

        response = db.from_("tasks").update(task_info).eq("id", str(task_id)).execute()
        
        if not response.data:
            return {"error": "Task not found"}
            
        return response.data[0]
    except Exception as e:
        return {"error": str(e)}

def delete_task(db, task_id: uuid.UUID):
    """
        Deletes a task from the database.
    """
    try:
        db.from_("tasks").delete().eq("id", str(task_id)).execute()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        return {"error": str(e)}



def add_dependency(db, task_id: uuid.UUID, depends_on_task_id: uuid.UUID):
    """
        Creates a dependency link between two tasks.
    """
    try:
        response = db.from_("task_dependencies").insert({
            "task_id": str(task_id),
            "depends_on_task_id": str(depends_on_task_id)
        }).execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}

def remove_dependency(db, task_id: uuid.UUID, depends_on_task_id: uuid.UUID):
    """
        Removes a dependency link between two tasks.
    """
    try:
        db.from_("task_dependencies").delete().match({
            "task_id": str(task_id),
            "depends_on_task_id": str(depends_on_task_id)
        }).execute()
        return {"message": "Dependency removed successfully"}
    except Exception as e:
        return {"error": str(e)}
    
def add_assignment(db, task_id: uuid.UUID, assignee_id: uuid.UUID):
    """
        Assigns a user to a task
    """
    try:
         assignment = {
             "task_id": str(task_id),
             "user_id": str(assignee_id)
         }
         assignment_response = db.from_("task_members").insert(assignment).execute()
         return assignment_response.data
    except Exception as e:
        return {"error": str(e)}
    

def get_assignments(db, task_id: uuid.UUID):
    """
        Gets all users assigned to a task along with their user profile
    """
    try:
        assignments_response = (
            db.from_("task_members")
                    .select("user:userprofile(*)")
                    .eq("task_id", task_id)
        ).execute()
        return assignments_response.data
    except Exception as e:
        return {"error": str(e)}   
    

def delete_assignment(db, task_id: uuid.UUID, assignee_id: uuid.UUID):
    """
        Removes a user assignment from a task
    """
    try:
         remove_response = db.from_("task_members").delete().match({
             "task_id": task_id,
             "user_id": assignee_id
         }).execute()
         return remove_response.data
    except Exception as e:
        return {"error": str(e)}