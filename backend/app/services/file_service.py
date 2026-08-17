from pathlib import Path
from uuid import uuid4
import filetype
from fastapi import UploadFile, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.students_model import Student
from app.models.files_model import UploadedFiles, ProfilePicture
from app.repository import file_repository as repo
from app.core.encryption import encrypt_bytes, decrypt_bytes
from app.core.supabase_client import supabase, SUPABASE_BUCKET

FILES_PREFIX = "files"
PROFILE_PREFIX = "profile_pictures"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
ALLOWED_DOCUMENT_TYPES = ALLOWED_IMAGE_TYPES | {"application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _detect_and_validate(content: bytes, allowed_types: set) -> str:
    kind = filetype.guess(content)
    if kind is None:
        raise HTTPException(status_code=400, detail="Invalid file.")
    if kind.mime not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size should not exceed 5 MB.")
    return kind.mime


def _storage_put(key: str, data: bytes, content_type: str = "application/octet-stream"):
    supabase.storage.from_(SUPABASE_BUCKET).upload(
        key,
        data,
        {"content-type": content_type},
    )


def _storage_get(key: str) -> bytes:
    try:
        return supabase.storage.from_(SUPABASE_BUCKET).download(key)
    except Exception:
        raise HTTPException(status_code=404, detail="File missing from storage")


def _storage_delete(key: str):
    supabase.storage.from_(SUPABASE_BUCKET).remove([key])


def _storage_exists(key: str) -> bool:
    try:
        supabase.storage.from_(SUPABASE_BUCKET).download(key)
        return True
    except Exception:
        return False


async def upload_user_profile_picture(profile: UploadFile, db: AsyncSession, current_user: Student):
    content = await profile.read()
    mime = _detect_and_validate(content, ALLOWED_IMAGE_TYPES)
    existing = await repo.get_profile_picture(db, current_user.id)
    if existing and _storage_exists(existing.file_path):
        _storage_delete(existing.file_path)
        await repo.delete_profile_picture(db, current_user.id)

    extension = Path(profile.filename).suffix
    stored_name = f"{uuid4()}{extension}"
    storage_key = f"{PROFILE_PREFIX}/{current_user.id}/{stored_name}"

    encrypted = encrypt_bytes(content)
    _storage_put(storage_key, encrypted)

    picture = ProfilePicture(
        student_id=current_user.id,
        filename=profile.filename,
        content_type=mime,
        file_path=storage_key,
        stored_name=stored_name,
    )
    return await repo.upload_profile_picture(db, picture)


async def delete_user_profile_picture(db: AsyncSession, current_user: Student):
    existing = await repo.get_profile_picture(db, current_user.id)
    if existing is None:
        raise HTTPException(status_code=404, detail="No profile picture found")
    if _storage_exists(existing.file_path):
        _storage_delete(existing.file_path)
    return await repo.delete_profile_picture(db, current_user.id)


async def view_profile_picture_content(db: AsyncSession, current_user: Student):
    picture = await repo.get_profile_picture(db, current_user.id)
    if picture is None:
        raise HTTPException(status_code=404, detail="No profile picture set")
    encrypted = _storage_get(picture.file_path)
    decrypted = decrypt_bytes(encrypted)
    return Response(content=decrypted, media_type=picture.content_type)

async def upload_user_file(profile: UploadFile, category: str, db: AsyncSession, current_user: Student):
    content = await profile.read()
    mime = _detect_and_validate(content, ALLOWED_DOCUMENT_TYPES)

    count = await repo.count_files_by_category(db, current_user.id, category)
    if category.lower() == "photo" and count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 photos allowed.")
    if category.lower() == "document" and count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 documents allowed.")

    extension = Path(profile.filename).suffix
    stored_name = f"{uuid4()}{extension}"
    storage_key = f"{FILES_PREFIX}/{current_user.id}/{stored_name}"

    encrypted = encrypt_bytes(content)
    _storage_put(storage_key, encrypted)

    new_file = UploadedFiles(
        student_id=current_user.id,
        name=profile.filename,
        filename=profile.filename,
        stored_name=stored_name,
        file_path=storage_key,
        content_type=mime,
        category=category,
    )
    return await repo.upload_files(db, new_file)


async def get_file(file_id: int, db: AsyncSession, current_user: Student) -> UploadedFiles:
    file = await repo.view_file(db, file_id)
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")
    if file.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")
    if not _storage_exists(file.file_path):
        raise HTTPException(status_code=404, detail="File missing from storage")
    return file


async def view_file_content(file_id: int, db: AsyncSession, current_user: Student):
    file = await get_file(file_id, db, current_user)
    encrypted = _storage_get(file.file_path)
    decrypted = decrypt_bytes(encrypted)
    return Response(content=decrypted, media_type=file.content_type)


async def remove_file(file_id: int, db: AsyncSession, current_user: Student):
    file = await get_file(file_id, db, current_user)
    result = await repo.delete_files(db, file_id)
    _storage_delete(file.file_path)
    return result


async def download_file_content(file_id: int, db: AsyncSession, current_user: Student):
    file = await get_file(file_id, db, current_user)
    encrypted = _storage_get(file.file_path)
    decrypted = decrypt_bytes(encrypted)
    return Response(
        content=decrypted,
        media_type=file.content_type,
        headers={"Content-Disposition": f'attachment; filename="{file.filename}"'},
    )


async def get_all_user_files(db: AsyncSession, current_user: Student):
    return await repo.get_all_files_by_student(db, current_user.id)