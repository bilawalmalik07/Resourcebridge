import os
import json
import requests
import tempfile
import io
import docx
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

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

TEXT_EXTRACTABLE = {
    ".docx", ".doc", ".xlsx", ".xls",
    ".pptx", ".ppt", ".txt", ".rtf", ".csv"
}

PROMPT = """
You are the core intelligence of ResourceBridge — a platform helping immigrant 
and working-class families understand important documents.

Analyze the provided document and perform FOUR tasks:

1. OCR_TEXT: Extract all readable text exactly as it appears.

2. SUMMARY_EN: Plain-language English summary covering:
   - What this document is
   - What action the family needs to take
   - Any deadlines
   - Who sent it and why it matters

3. SUMMARY_ES: Same summary in simple Spanish.

4. ACTION_ITEMS: JSON array of action items.
   Each: {"task": "...", "deadline": "YYYY-MM-DD or null", "priority": "high|medium|low"}
   If none: []

Return EXACTLY in this format:

---OCR_TEXT---
[text here]
---SUMMARY_EN---
[English summary here]
---SUMMARY_ES---
[Spanish summary here]
---ACTION_ITEMS---
[JSON array here]
"""


def _detect_ext_from_content_type(content_type: str) -> str | None:
    ct = content_type.lower()
    if "pdf" in ct:
        return ".pdf"
    if "png" in ct:
        return ".png"
    if "jpeg" in ct or "jpg" in ct:
        return ".jpg"
    if "wordprocessingml" in ct or "msword" in ct:
        return ".docx"
    if "spreadsheetml" in ct or "ms-excel" in ct:
        return ".xlsx"
    if "presentationml" in ct or "powerpoint" in ct:
        return ".pptx"
    if "text/plain" in ct:
        return ".txt"
    return None


def _extract_text_from_office(file_bytes: bytes, ext: str) -> str:
    try:
        if ext in (".docx", ".doc"):
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([para.text for para in doc.paragraphs])

        elif ext in (".xlsx", ".xls"):
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True)
            lines = []
            for sheet in wb.worksheets:
                lines.append(f"[Sheet: {sheet.title}]")
                for row in sheet.iter_rows(values_only=True):
                    lines.append(
                        "\t".join(str(c) if c is not None else "" for c in row))
            return "\n".join(lines)

        elif ext in (".txt", ".csv", ".rtf"):
            return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""
    return ""


def _send_file_to_gemini(file_bytes: bytes, ext: str) -> str:
    mime_type = GEMINI_SUPPORTED[ext]
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        uploaded = client.files.upload(
            file=tmp_path,
            config=types.UploadFileConfig(mime_type=mime_type)
        )
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[uploaded, PROMPT]
        )
        return response.text
    finally:
        os.unlink(tmp_path)


def _send_text_to_gemini(text: str) -> str:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{PROMPT}\n\nDocument text:\n\n{text}"
    )
    return response.text


def process_document_with_ai(file_url: str) -> dict:
    try:
        resp = requests.get(file_url, timeout=30)
        resp.raise_for_status()
        file_bytes = resp.content
        ext = Path(file_url.split("?")[0]).suffix.lower()

        if ext in GEMINI_SUPPORTED:
            response_text = _send_file_to_gemini(file_bytes, ext)
        else:
            extracted = _extract_text_from_office(file_bytes, ext)
            response_text = _send_text_to_gemini(extracted)

        return _parse_response(response_text)
    except Exception as e:
        return {"ocr_text": "", "ai_summary": "Error processing document.", "ai_summary_es": "Error al procesar.", "action_items": []}


def _parse_response(response_text: str) -> dict:
    ocr_text = _extract_section(response_text, "OCR_TEXT", "SUMMARY_EN")
    summary_en = _extract_section(response_text, "SUMMARY_EN", "SUMMARY_ES")
    summary_es = _extract_section(response_text, "SUMMARY_ES", "ACTION_ITEMS")
    action_raw = _extract_section(response_text, "ACTION_ITEMS", None)
    try:
        action_items = json.loads(action_raw)
    except:
        action_items = []
    return {"ocr_text": ocr_text, "ai_summary": summary_en, "ai_summary_es": summary_es, "action_items": action_items}


def _extract_section(text: str, start_tag: str, end_tag: str | None) -> str:
    start_marker = f"---{start_tag}---"
    try:
        start_idx = text.index(start_marker) + len(start_marker)
        if end_tag:
            end_idx = text.index(f"---{end_tag}---")
            return text[start_idx:end_idx].strip()
        return text[start_idx:].strip()
    except:
        return ""
