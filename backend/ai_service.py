import os
import requests
import tempfile
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# Supported MIME types Gemini can process
SUPPORTED_MIME_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def process_document_with_ai(file_url: str) -> dict:
    """
    Downloads the document from the URL, then sends the actual file bytes
    to Gemini for OCR extraction and plain-language summarization.

    FIX: The original code passed a raw URL string inside a text prompt.
    Gemini cannot fetch arbitrary URLs — it requires actual file content.
    This version downloads the file first, then uploads it via the Files API.
    """
    try:
        # --- Step 1: Download the file from the URL ---
        print(f"Downloading document from: {file_url}")
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()

        # Detect file extension from URL to determine MIME type
        url_path = file_url.split("?")[0]  # Strip query params
        ext = Path(url_path).suffix.lower()
        mime_type = SUPPORTED_MIME_TYPES.get(ext, "application/pdf")

        # --- Step 2: Save to a temp file and upload to Gemini Files API ---
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        print(f"Uploading to Gemini Files API ({mime_type})...")
        uploaded_file = client.files.upload(
            file=tmp_path,
            config=types.UploadFileConfig(mime_type=mime_type)
        )

        # --- Step 3: Send the uploaded file reference to Gemini for analysis ---
        prompt = """
        You are the core intelligence layer of ResourceBridge, a platform that helps 
        immigrant and working-class families understand their important documents.

        Analyze the provided document and perform two tasks:

        1. OCR Extraction: Extract all readable text from the document exactly as it appears.
        2. Plain-Language Summary: Provide a clear, simplified, jargon-free summary of what 
           the document means. If the document is not in English, translate the summary into 
           clear English. Focus on: what action is required, any deadlines, who it is from, 
           and what it means for the family.

        Return your response in this exact format:
        ---RAW_TEXT---
        [Insert all extracted raw text here]
        ---SUMMARY---
        [Insert the plain-language summary/translation here]
        """

        ai_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded_file, prompt]
        )

        response_text = ai_response.text
        raw_text = ""
        summary = ""

        if "---RAW_TEXT---" in response_text and "---SUMMARY---" in response_text:
            parts = response_text.split("---SUMMARY---")
            raw_text = parts[0].replace("---RAW_TEXT---", "").strip()
            summary = parts[1].strip()
        else:
            summary = response_text
            raw_text = "OCR text extraction processed inside summary."

        # Clean up the temp file
        os.unlink(tmp_path)

        return {
            "ocr_text": raw_text,
            "ai_summary": summary
        }

    except requests.exceptions.RequestException as e:
        print(f"Error downloading document from URL: {e}")
        return {
            "ocr_text": "Failed to download document from the provided URL.",
            "ai_summary": "Could not process document — please check the URL is publicly accessible."
        }
    except Exception as e:
        print(f"Error processing document with Gemini: {e}")
        return {
            "ocr_text": "Failed to extract text automatically.",
            "ai_summary": "Summary unavailable at this moment."
        }
