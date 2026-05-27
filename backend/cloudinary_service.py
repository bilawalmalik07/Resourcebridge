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
    Uploads file bytes to Cloudinary and returns a publicly accessible URL.

    Key behavior:
    - Images (png/jpg/etc): resource_type='image', URL has no extension needed
    - Everything else (pdf, docx, xlsx...): resource_type='raw'
      Cloudinary raw URLs look like: .../raw/upload/v.../folder/filename.docx
      The extension IS in the URL when use_filename=True — ai_service reads it from there.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    image_exts = {"png", "jpg", "jpeg", "gif",
                  "webp", "heic", "heif", "tiff", "tif", "bmp"}
    resource_type = "image" if ext in image_exts else "raw"

    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )

    url = result["secure_url"]
    print(f"Cloudinary upload complete → {url}")
    return url
