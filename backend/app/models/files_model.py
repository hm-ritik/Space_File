from app.core.database import Base
from app.models.students_model import Student
from sqlalchemy import Column , Integer , String , DateTime , ForeignKey
from datetime import datetime


class ProfilePicture(Base):
    __tablename__ = "profile_pictures"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    stored_name=Column(String , nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)   


class UploadedFiles(Base):
    __tablename__= "uploaded_files"
    id =Column(Integer , primary_key=True)
    student_id=Column(Integer , ForeignKey("students.id") , nullable=False , unique=True)
    name=Column(String , nullable=False)
    content_type = Column(String, nullable=False)
    file_path=Column(String , nullable=False)
    filename=Column(String , nullable=False)
    stored_name=Column(String , nullable=False)
    category=Column(String , nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)   


        
