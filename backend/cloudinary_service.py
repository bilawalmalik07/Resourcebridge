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
    """Upload file bytes to Cloudinary and return the secure URL."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    image_exts = {"png", "jpg", "jpeg", "gif",
                  "webp", "heic", "heif", "tiff", "tif", "bmp", "pdf"}
    resource_type = "image" if ext in image_exts else "raw"

    safe_name = re.sub(r"[^\w.\-]", "_", filename)

    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=safe_name,
        resource_type=resource_type,
        unique_filename=True,
        overwrite=False,
        access_mode="public",
    )

    url = result["secure_url"]
    print(f"Cloudinary upload complete → {url}")
    return url
