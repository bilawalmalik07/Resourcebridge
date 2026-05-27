import os
import re
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
    The original filename (including extension) is preserved in the public_id
    so that the returned URL retains the extension — critical for ai_service.py
    to correctly detect the file type (e.g. .docx, .xlsx, .pptx).
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    resource_type = "image" if ext in (
        "png", "jpg", "jpeg", "gif", "webp") else "raw"

    # Sanitize filename: replace spaces/special chars but keep the extension
    safe_name = re.sub(r"[^\w.\-]", "_", filename)

    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=safe_name,        # preserves .docx / .pdf / etc. in the URL
        resource_type=resource_type,
        unique_filename=True,
        overwrite=False,
    )

    return result["secure_url"]
