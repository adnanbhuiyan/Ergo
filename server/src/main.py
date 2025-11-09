from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.auth.router import auth_router 
from src.projects.router import projects_router
from src.tasks.router import tasks_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  
    allow_methods=["*"],     
    allow_headers=["*"],     
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tasks_router)

