import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_file_to_cloudinary(file_bytes: bytes, filename: str, folder: str = "resourcebridge") -> str:
    """
    Uploads a file's raw bytes to Cloudinary and returns the secure public URL.
    Files are stored under the 'resourcebridge' folder organized by user.
    """
    # Determine resource type — Cloudinary needs 'raw' for PDFs, 'image' for images
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    resource_type = "image" if ext in (
        "png", "jpg", "jpeg", "gif", "webp") else "raw"

    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
    )

    return result["secure_url"]
