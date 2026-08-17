from pydantic_settings import BaseSettings , SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL:str
    SECRET_KEY:str
    ENCRYPTION_KEY:str
    SUPABASE_URL:str
    SUPABASE_SERVICE_KEY:str
    SUPABASE_BUCKET:str="file-storage"

    ALGORITHM:str="HS256"
    ACCESS_TOKEN_TIME: int = 30

  
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings=Settings()