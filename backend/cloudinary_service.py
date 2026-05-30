import os
import re
import time
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


def _extract_public_id(file_url: str) -> tuple[str, str]:
    """
    Extract the public_id and resource_type from a Cloudinary secure URL.

    Example URL:
      https://res.cloudinary.com/<cloud>/raw/upload/v1234567890/resourcebridge/user_22/foo.PDF
      https://res.cloudinary.com/<cloud>/image/upload/v1234567890/resourcebridge/user_22/foo.png

    Returns (public_id_without_extension, resource_type)
    """
    resource_type = "raw" if "/raw/" in file_url else "image"

    # Split on /upload/ to get everything after it
    parts = file_url.split("/upload/", 1)
    if len(parts) != 2:
        return file_url, resource_type

    after_upload = parts[1]

    # Strip optional version segment like "v1234567890/"
    after_upload = re.sub(r"^v\d+/", "", after_upload)

    # Strip query string
    after_upload = after_upload.split("?")[0]

    # For raw resources Cloudinary expects the public_id WITH the extension
    # For image resources it expects WITHOUT the extension
    if resource_type == "image":
        # Remove extension
        public_id = re.sub(r"\.[^.]+$", "", after_upload)
    else:
        # Keep extension — raw resources need it
        public_id = after_upload

    print(f"Extracted public_id='{public_id}' resource_type='{resource_type}'")
    return public_id, resource_type


def get_signed_download_url(file_url: str) -> str:
    """
    Return a short-lived signed Cloudinary download URL for the given stored URL.
    Works for both image and raw (PDF, docx, etc.) resources.
    """
    try:
        public_id, resource_type = _extract_public_id(file_url)

        signed_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="upload",
            secure=True,
            sign_url=True,
            expires_at=int(time.time()) + 300,  # 5 minutes
        )

        print(f"Signed URL → {signed_url}")
        return signed_url
    except Exception as e:
        print(
            f"Could not generate signed URL: {e} — falling back to original URL")
        return file_url
