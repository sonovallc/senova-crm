"""
Cloudinary storage service for file uploads

Handles uploading files to Cloudinary and returns public URLs
"""

import cloudinary
import cloudinary.uploader
from typing import Optional
from fastapi import UploadFile
from app.config.settings import get_settings

settings = get_settings()


def initialize_cloudinary():
    """Initialize Cloudinary configuration"""
    if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )
        return True
    return False


async def upload_file(
    file: UploadFile,
    folder: str = "eve-crm/chat",
    resource_type: str = "auto"
) -> str:
    """
    Upload file to Cloudinary and return secure URL

    Args:
        file: FastAPI UploadFile object
        folder: Cloudinary folder path
        resource_type: Type of resource (image, video, raw, auto)

    Returns:
        str: Secure URL of uploaded file

    Raises:
        Exception: If upload fails
    """
    # Initialize Cloudinary if not already initialized
    if not initialize_cloudinary():
        raise Exception("Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.")

    # Read file content
    file_content = await file.read()

    # Reset file pointer for potential re-use
    await file.seek(0)

    # Upload to Cloudinary
    upload_result = cloudinary.uploader.upload(
        file_content,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False
    )

    # Return secure URL
    return upload_result.get('secure_url')


async def upload_files(
    files: list[UploadFile],
    folder: str = "eve-crm/chat"
) -> list[str]:
    """
    Upload multiple files to Cloudinary

    Args:
        files: List of FastAPI UploadFile objects
        folder: Cloudinary folder path

    Returns:
        list[str]: List of secure URLs
    """
    urls = []
    for file in files:
        url = await upload_file(file, folder)
        urls.append(url)
    return urls


def delete_file(public_id: str) -> dict:
    """
    Delete file from Cloudinary

    Args:
        public_id: Cloudinary public ID of the file

    Returns:
        dict: Deletion result
    """
    if not initialize_cloudinary():
        raise Exception("Cloudinary is not configured.")

    return cloudinary.uploader.destroy(public_id)
