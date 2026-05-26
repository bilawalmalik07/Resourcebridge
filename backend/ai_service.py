import os
import json
import requests
import tempfile
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

SUPPORTED_MIME_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword"
}


def process_document_with_ai(file_url: str) -> dict:
    """
    Downloads the document from Cloudinary URL, sends actual bytes to Gemini,
    and returns OCR text, English summary, Spanish summary, and action items.
    """
    try:
        print(f"Downloading document from: {file_url}")
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()

        url_path = file_url.split("?")[0]
        ext = Path(url_path).suffix.lower()
        mime_type = SUPPORTED_MIME_TYPES.get(ext, "application/pdf")

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        print(f"Uploading to Gemini Files API ({mime_type})...")
        uploaded_file = client.files.upload(
            file=tmp_path,
            config=types.UploadFileConfig(mime_type=mime_type)
        )

        prompt = """
        You are the core intelligence of ResourceBridge — a platform helping immigrant 
        and working-class families understand important documents.

        Analyze the provided document and perform FOUR tasks:

        1. OCR_TEXT: Extract all readable text exactly as it appears in the document.

        2. SUMMARY_EN: Write a clear, plain-language English summary. Focus on:
           - What this document is
           - What action (if any) the family needs to take
           - Any deadlines mentioned
           - Who sent it and why it matters

        3. SUMMARY_ES: Write the same summary in clear, simple Spanish.

        4. ACTION_ITEMS: Extract a JSON array of specific action items or reminders 
           from the document. Each item should be an object with:
           - "task": short description of what needs to be done
           - "deadline": deadline if mentioned, otherwise null
           - "priority": "high", "medium", or "low"
           
           Example: [{"task": "Submit form by mail", "deadline": "2024-03-15", "priority": "high"}]
           If no action items exist, return an empty array: []

        Return your response in EXACTLY this format with no extra text outside the tags:

        ---OCR_TEXT---
        [extracted text here]
        ---SUMMARY_EN---
        [English summary here]
        ---SUMMARY_ES---
        [Spanish summary here]
        ---ACTION_ITEMS---
        [JSON array here]
        """

        ai_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded_file, prompt]
        )

        response_text = ai_response.text
        os.unlink(tmp_path)

        # Parse each section from the structured response
        ocr_text = _extract_section(response_text, "OCR_TEXT", "SUMMARY_EN")
        summary_en = _extract_section(
            response_text, "SUMMARY_EN", "SUMMARY_ES")
        summary_es = _extract_section(
            response_text, "SUMMARY_ES", "ACTION_ITEMS")
        action_items_raw = _extract_section(
            response_text, "ACTION_ITEMS", None)

        # Parse action items JSON safely
        action_items = []
        try:
            action_items = json.loads(action_items_raw)
        except (json.JSONDecodeError, Exception):
            action_items = []

        return {
            "ocr_text": ocr_text or "Text extraction processed.",
            "ai_summary": summary_en or "Summary unavailable.",
            "ai_summary_es": summary_es or "Resumen no disponible.",
            "action_items": action_items,
        }

    except requests.exceptions.RequestException as e:
        print(f"Error downloading document: {e}")
        return {
            "ocr_text": "Failed to download document from the provided URL.",
            "ai_summary": "Could not process document — please check the URL is publicly accessible.",
            "ai_summary_es": "No se pudo procesar el documento.",
            "action_items": [],
        }
    except Exception as e:
        print(f"Error processing document with Gemini: {e}")
        return {
            "ocr_text": "Failed to extract text automatically.",
            "ai_summary": "Summary unavailable at this moment.",
            "ai_summary_es": "Resumen no disponible en este momento.",
            "action_items": [],
        }


def _extract_section(text: str, start_tag: str, end_tag: str | None) -> str:
    """Helper to extract content between ---TAG--- markers."""
    start_marker = f"---{start_tag}---"
    try:
        start_idx = text.index(start_marker) + len(start_marker)
        if end_tag:
            end_marker = f"---{end_tag}---"
            end_idx = text.index(end_marker)
            return text[start_idx:end_idx].strip()
        else:
            return text[start_idx:].strip()
    except ValueError:
        return ""
