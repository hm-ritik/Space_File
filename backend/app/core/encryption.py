from cryptography.fernet import Fernet
from app.core.config import settings


ENCRYPTION_KEY=settings.ENCRYPTION_KEY
if not ENCRYPTION_KEY:
    raise RuntimeError("ENCRYPTION_KEY not set in .env")

fernet = Fernet(ENCRYPTION_KEY.encode())


def encrypt_bytes(data: bytes) -> bytes:
    return fernet.encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    return fernet.decrypt(data)