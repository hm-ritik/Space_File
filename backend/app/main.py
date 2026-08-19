from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.routes.students_routes import router as student_router
from app.routes.file_route import router as file_router
from app.core.database import engine, Base
from app.models.students_model import Student


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
   

app = FastAPI(title="Space File" , lifespan=lifespan)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         
    allow_credentials=False,     
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student_router, prefix="/students", tags=["Students"])
app.include_router(file_router, prefix="/files", tags=["Files"])


@app.get("/home")
def home():
    return {"Message": "Checking Server"}