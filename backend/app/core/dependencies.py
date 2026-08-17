from jose import jwt
from fastapi.security import OAuth2PasswordBearer 
from fastapi import Depends , HTTPException
from datetime import datetime , timedelta
from app.core.database import SessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.students_model import Student
from app.core.config import settings



oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)
def create_access_token(data:dict):
    to_encode=data.copy()
    expire=datetime.utcnow() +timedelta(minutes= settings.ACCESS_TOKEN_TIME)
    to_encode.update({"exp":expire})
    encode_token=jwt.encode(to_encode , settings.SECRET_KEY , algorithm=settings.ALGORITHM)
    return encode_token

async def get_db():
    async with SessionLocal() as session:
        yield session


async def get_current_user(token:str=Depends(oauth2_scheme), db:AsyncSession=Depends(get_db)):
     payload=jwt.decode(token , settings.SECRET_KEY , algorithms=[settings.ALGORITHM])
     user_email=payload.get("sub")
     if user_email is None:
              raise HTTPException(status_code=401 , detail="User Not Exists")
     user= await db.execute(select(Student).where(Student.email==user_email))
     result= user.scalar_one_or_none()
     if result is None:
         raise HTTPException(status_code=401 , detail="User Not Exists")
     return result

async def require_admin(current_user=Depends(get_current_user)):
     if current_user.role != 'Admin':
          raise HTTPException(status_code=403 , detail="UnAuthorize Access")
     return current_user


    
