import os
import re
import cloudinary
import cloudinary.uploader
import cloudinary.utils
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
                  "webp", "heic", "heif", "tiff", "tif", "bmp"}
    # PDFs and docs must use "raw" so Cloudinary doesn't convert/mangle them.
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
        type="upload",
    )

    url = result["secure_url"]
    print(f"Cloudinary upload complete → {url}")
    return url


def get_signed_download_url(file_url: str) -> str:
    """
    Given a stored Cloudinary URL, return a short-lived signed version for downloading.
    Used by ai_service to bypass 401 on raw resources.
    """
    import time
    try:
        parts = file_url.split("/upload/", 1)
        if len(parts) != 2:
            return file_url

        resource_type = "raw" if "/raw/" in file_url else "image"
        # Strip version prefix like "v1234567890/"
        after_upload = parts[1]
        if after_upload.startswith("v") and "/" in after_upload:
            after_upload = after_upload.split("/", 1)[1]

        options = dict(
            resource_type=resource_type,
            type="upload",
            secure=True,
            sign_url=True,
            # 5 min — enough to download & process
            expires_at=int(time.time()) + 300,
        )

        signed_url = cloudinary.utils.cloudinary_url(
            after_upload, **options)[0]
        return signed_url
    except Exception as e:
        print(f"Could not generate signed URL: {e}, falling back to original")
        return file_url
