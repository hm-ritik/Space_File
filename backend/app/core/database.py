from sqlalchemy.ext.asyncio import AsyncSession , create_async_engine , async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings




engine=create_async_engine( settings.DATABASE_URL,
    echo=False,
    connect_args={"statement_cache_size": 0})
SessionLocal=async_sessionmaker(bind=engine , class_=AsyncSession,expire_on_commit=False)

class Base(DeclarativeBase):
    pass









  
