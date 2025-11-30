"""
Local file storage service for development/testing

Saves uploaded files to a local directory and returns URLs
"""

import os
import uuid
from pathlib import Path
from typing import List
from fastapi import UploadFile
from app.config.settings import get_settings

settings = get_settings()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("/app/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def upload_file(
    file: UploadFile,
    subfolder: str = "chat"
) -> str:
    """
    Save file locally and return accessible URL

    Args:
        file: FastAPI UploadFile object
        subfolder: Subdirectory within uploads folder

    Returns:
        str: URL to access the uploaded file

    Raises:
        Exception: If upload fails
    """
    try:
        # Create subfolder if needed
        folder_path = UPLOAD_DIR / subfolder
        folder_path.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = folder_path / unique_filename

        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Reset file pointer
        await file.seek(0)

        # Return URL (assuming static files are served at /static/)
        relative_path = f"static/uploads/{subfolder}/{unique_filename}"
        return f"{settings.backend_url}/{relative_path}"

    except Exception as e:
        raise Exception(f"Failed to save file locally: {str(e)}")


async def upload_files(
    files: List[UploadFile],
    subfolder: str = "chat"
) -> List[str]:
    """
    Save multiple files locally

    Args:
        files: List of FastAPI UploadFile objects
        subfolder: Subdirectory within uploads folder

    Returns:
        List[str]: List of URLs to access uploaded files
    """
    urls = []
    for file in files:
        url = await upload_file(file, subfolder)
        urls.append(url)
    return urls


def delete_file(file_url: str) -> bool:
    """
    Delete file from local storage

    Args:
        file_url: URL of the file to delete

    Returns:
        bool: True if deleted successfully
    """
    try:
        # Extract relative path from URL
        if "/static/uploads/" in file_url:
            relative_path = file_url.split("/static/uploads/")[1]
            file_path = UPLOAD_DIR / relative_path

            if file_path.exists():
                file_path.unlink()
                return True

        return False
    except Exception:
        return False
