import os
import re
import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
import cloudinary.api
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


def _parse_url(file_url: str) -> tuple[str, str]:
    """
    Parse a Cloudinary URL into (public_id, resource_type).
    Handles both image and raw resource types correctly.
    Raw resources keep their extension in the public_id.
    Image resources strip their extension.
    """
    resource_type = "raw" if "/raw/" in file_url else "image"

    parts = file_url.split("/upload/", 1)
    if len(parts) != 2:
        raise ValueError(f"Not a valid Cloudinary upload URL: {file_url}")

    # Strip query string, then version prefix (v followed by digits and slash)
    after_upload = parts[1].split("?")[0]
    after_upload = re.sub(r"^v\d+/", "", after_upload)

    if resource_type == "image":
        # Cloudinary image public_ids do NOT include the file extension
        public_id = re.sub(r"\.[^./]+$", "", after_upload)
    else:
        # Cloudinary raw public_ids MUST include the file extension
        public_id = after_upload

    return public_id, resource_type


def get_signed_download_url(file_url: str) -> str:
    """
    Return a short-lived authenticated URL for downloading a Cloudinary asset.
    Uses private_download_url which works even when delivery is restricted.
    Falls back gracefully to signed URL, then to original URL.
    """
    try:
        public_id, resource_type = _parse_url(file_url)
        print(
            f"Fetching via private_download_url: public_id='{public_id}' type='{resource_type}'")

        # Determine the format (file extension) — required by private_download_url for raw
        ext_match = re.search(r"\.([^./]+)$", public_id)
        fmt = ext_match.group(1) if ext_match else ""

        url = cloudinary.utils.private_download_url(
            public_id,
            fmt,
            resource_type=resource_type,
            type="upload",
            expires_at=int(time.time()) + 300,
            attachment=False,
        )
        print(f"Private download URL → {url}")
        return url

    except Exception as e:
        print(f"private_download_url error: {e}")
        # Fallback: standard signed URL
        try:
            public_id, resource_type = _parse_url(file_url)
            signed_url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type=resource_type,
                type="upload",
                secure=True,
                sign_url=True,
                expires_at=int(time.time()) + 300,
            )
            print(f"Fallback signed URL → {signed_url}")
            return signed_url
        except Exception as e2:
            print(f"All signing failed: {e2} — returning original URL")
            return file_url
