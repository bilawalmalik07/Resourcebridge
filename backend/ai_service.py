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

# ONLY what Gemini Files API actually supports natively
GEMINI_SUPPORTED = {
    ".pdf":  "application/pdf",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif":  "image/gif",
    ".tiff": "image/tiff",
    ".tif":  "image/tiff",
    ".bmp":  "image/bmp",
}

# These get text extracted locally first, then sent as plain text to Gemini
TEXT_EXTRACTABLE = {
    ".docx", ".doc", ".xlsx", ".xls",
    ".pptx", ".ppt", ".txt", ".rtf", ".csv"
}

PROMPT = """
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

4. ACTION_ITEMS: Extract a JSON array of specific action items or reminders.
   Each item: {"task": "...", "deadline": "YYYY-MM-DD or null", "priority": "high|medium|low"}
   If none exist return: []

Return EXACTLY in this format, nothing outside the tags:

---OCR_TEXT---
[extracted text here]
---SUMMARY_EN---
[English summary here]
---SUMMARY_ES---
[Spanish summary here]
---ACTION_ITEMS---
[JSON array here]
"""


def _extract_text_from_office(file_bytes: bytes, ext: str) -> str:
    """Extract plain text from Office files so Gemini can read them as text."""
    if ext in (".docx", ".doc"):
        try:
            import mammoth
            import io
            return mammoth.extract_raw_text(io.BytesIO(file_bytes)).value
        except Exception:
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
    try:
        print(f"Downloading: {file_url}")
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()
        file_bytes = response.content

        url_clean = file_url.split("?")[0]
        ext = Path(url_clean).suffix.lower()

        if not ext or (ext not in GEMINI_SUPPORTED and ext not in TEXT_EXTRACTABLE):
            content_type = response.headers.get("Content-Type", "")
            if "pdf" in content_type:
                ext = ".pdf"
            elif "png" in content_type:
                ext = ".png"
            elif "jpeg" in content_type or "jpg" in content_type:
                ext = ".jpg"
            elif "word" in content_type or "docx" in content_type:
                ext = ".docx"
            elif "excel" in content_type or "xlsx" in content_type:
                ext = ".xlsx"
            else:

                ext = ".pdf"
            print(
                f"Extension sniffed from Content-Type '{content_type}' → {ext}")

        if ext in GEMINI_SUPPORTED:
            mime_type = GEMINI_SUPPORTED[ext]

            suffix = ext if ext else ".pdf"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            print(f"Sending to Gemini Files API as {mime_type}...")
            uploaded_file = client.files.upload(
                file=tmp_path,
                config=types.UploadFileConfig(mime_type=mime_type)
            )
            os.unlink(tmp_path)

            ai_response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[uploaded_file, PROMPT]
            )

        elif ext in TEXT_EXTRACTABLE:
            print(f"Extracting text from {ext}...")
            extracted = _extract_text_from_office(file_bytes, ext)

            if not extracted.strip():
                return {
                    "ocr_text": "Could not extract text from this file.",
                    "ai_summary": "Unable to read this file. Please convert it to PDF and re-upload.",
                    "ai_summary_es": "No se pudo leer este archivo. Por favor conviértalo a PDF.",
                    "action_items": [],
                }

            ai_response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{PROMPT}\n\nHere is the document text:\n\n{extracted}"
            )

        else:
            return {
                "ocr_text": "",
                "ai_summary": "Unsupported file type. Please upload a PDF, image, or Office document.",
                "ai_summary_es": "Tipo de archivo no compatible. Suba un PDF, imagen o documento de Office.",
                "action_items": [],
            }

        response_text = ai_response.text

        ocr_text = _extract_section(response_text, "OCR_TEXT",    "SUMMARY_EN")
        summary_en = _extract_section(
            response_text, "SUMMARY_EN",  "SUMMARY_ES")
        summary_es = _extract_section(
            response_text, "SUMMARY_ES",  "ACTION_ITEMS")
        action_raw = _extract_section(response_text, "ACTION_ITEMS", None)

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
        print(f"Download error: {e}")
        return {
            "ocr_text": "Failed to download the document.",
            "ai_summary": "Could not reach the file URL. Please try again.",
            "ai_summary_es": "No se pudo acceder al archivo.",
            "action_items": [],
        }
    except Exception as e:
        print(f"Gemini processing error: {type(e).__name__}: {e}")
        return {
            "ocr_text": f"Error: {type(e).__name__}: {str(e)[:200]}",
            "ai_summary": "Summary unavailable at this moment.",
            "ai_summary_es": "Resumen no disponible en este momento.",
            "action_items": [],
        }


def _extract_section(text: str, start_tag: str, end_tag: str | None) -> str:
    start_marker = f"---{start_tag}---"
    try:
        start_idx = text.index(start_marker) + len(start_marker)
        if end_tag:
            end_idx = text.index(f"---{end_tag}---")
            return text[start_idx:end_idx].strip()
        return text[start_idx:].strip()
    except ValueError:
        return ""
