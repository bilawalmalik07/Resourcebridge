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

# File types Gemini can read natively
GEMINI_SUPPORTED = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".bmp": "image/bmp",
}

# File types we extract as plain text first, then send text to Gemini
TEXT_EXTRACTABLE = {".docx", ".doc", ".xlsx", ".xls",
                    ".pptx", ".ppt", ".txt", ".rtf", ".csv", ".odt"}


def _extract_text_from_office(file_bytes: bytes, ext: str) -> str:
    """Extract plain text from Office/text files so Gemini can read them."""
    if ext in (".docx", ".doc"):
        try:
            import mammoth
            import io
            result = mammoth.extract_raw_text(io.BytesIO(file_bytes))
            return result.value
        except ImportError:
            pass
        try:
            from docx import Document
            import io
            doc = Document(io.BytesIO(file_bytes))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return ""

    elif ext in (".xlsx", ".xls"):
        try:
            import openpyxl
            import io
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True)
            lines = []
            for sheet in wb.worksheets:
                lines.append(f"[Sheet: {sheet.title}]")
                for row in sheet.iter_rows(values_only=True):
                    lines.append(
                        "\t".join(str(c) if c is not None else "" for c in row))
            return "\n".join(lines)
        except Exception:
            return ""

    elif ext in (".pptx", ".ppt"):
        try:
            from pptx import Presentation
            import io
            prs = Presentation(io.BytesIO(file_bytes))
            lines = []
            for i, slide in enumerate(prs.slides):
                lines.append(f"[Slide {i+1}]")
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        lines.append(shape.text)
            return "\n".join(lines)
        except Exception:
            return ""

    elif ext in (".txt", ".csv", ".rtf"):
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""

    return ""


def process_document_with_ai(file_url: str) -> dict:
    """
    Downloads the document, sends it to Gemini for analysis.
    - PDFs and images: sent directly to Gemini Files API
    - Office files (docx, xlsx, etc.): text extracted first, then sent as a text prompt
    - Unknown/missing extension: defaults to PDF handling
    """
    try:
        print(f"Downloading document from: {file_url}")
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()

        # Try to get extension from URL, stripping Cloudinary query params
        url_path = file_url.split("?")[0]
        ext = Path(url_path).suffix.lower()

        # FIX: If Cloudinary strips the extension or it's unrecognized,
        # default to PDF — it's the most common document type
        if not ext or (ext not in GEMINI_SUPPORTED and ext not in TEXT_EXTRACTABLE):
            print(
                f"Unknown or missing extension '{ext}', defaulting to PDF handling")
            ext = ".pdf"

        file_bytes = response.content

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
           from the document. Each item should have:
           - "task": short description of what needs to be done
           - "deadline": deadline if mentioned, otherwise null
           - "priority": "high", "medium", or "low"
           
           If no action items exist, return an empty array: []

        Return EXACTLY in this format:

        ---OCR_TEXT---
        [extracted text here]
        ---SUMMARY_EN---
        [English summary here]
        ---SUMMARY_ES---
        [Spanish summary here]
        ---ACTION_ITEMS---
        [JSON array here]
        """

        if ext in GEMINI_SUPPORTED:
            # Native path: PDF or image → send file directly to Gemini
            mime_type = GEMINI_SUPPORTED[ext]
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            print(f"Uploading to Gemini Files API ({mime_type})...")
            uploaded_file = client.files.upload(
                file=tmp_path,
                config=types.UploadFileConfig(mime_type=mime_type)
            )
            os.unlink(tmp_path)

            ai_response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[uploaded_file, prompt]
            )

        else:
            # Office path: extract text, send as plain text prompt to Gemini
            print(f"Extracting text from {ext} file...")
            extracted_text = _extract_text_from_office(file_bytes, ext)

            if not extracted_text.strip():
                return {
                    "ocr_text": "Could not extract text from this file.",
                    "ai_summary": "Unable to read this file. Please try converting it to PDF first.",
                    "ai_summary_es": "No se pudo leer este archivo. Por favor conviértalo a PDF primero.",
                    "action_items": [],
                }

            text_prompt = f"""
            {prompt}
            
            Here is the full text content of the document:
            
            {extracted_text}
            """

            ai_response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=text_prompt
            )

        response_text = ai_response.text

        ocr_text = _extract_section(response_text, "OCR_TEXT",    "SUMMARY_EN")
        summary_en = _extract_section(
            response_text, "SUMMARY_EN",  "SUMMARY_ES")
        summary_es = _extract_section(
            response_text, "SUMMARY_ES",  "ACTION_ITEMS")
        action_raw = _extract_section(response_text, "ACTION_ITEMS", None)

        action_items = []
        try:
            action_items = json.loads(action_raw)
        except Exception:
            action_items = []

        return {
            "ocr_text":      ocr_text or "Text extraction processed.",
            "ai_summary":    summary_en or "Summary unavailable.",
            "ai_summary_es": summary_es or "Resumen no disponible.",
            "action_items":  action_items,
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
