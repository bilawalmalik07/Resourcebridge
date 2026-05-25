import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Initialize the Gemini Client using the key
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


def process_document_with_ai(file_url: str) -> dict:
    """
    Sends the document URL to Gemini to extract raw text (OCR) 
    and generate a plain-language summary/translation.
    """
    try:
        # Prompt telling the AI exactly how to behave as ResourceBridge's core engine
        prompt = f"""
        You are the core intelligence layer of ResourceBridge. Analyze the document located at this URL: {file_url}
        
        Perform two tasks:
        1. OCR Extraction: Extract all readable text from the document exactly as it appears.
        2. Plain-Language Summary: Provide a clear, simplified, jargon-free summary of what the document means. If the document is not in English, translate the summary into clear English.
        
        Return your response in this exact format:
        ---RAW_TEXT---
        [Insert all extracted raw text here]
        ---SUMMARY---
        [Insert the plain-language summary/translation here]
        """

        # Call the lightweight, ultra-fast Gemini Flash model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )

        response_text = response.text

        # give raw text and summary blocks from the AI's response
        raw_text = ""
        summary = ""

        if "---RAW_TEXT---" in response_text and "---SUMMARY---" in response_text:
            parts = response_text.split("---SUMMARY---")
            raw_text = parts[0].replace("---RAW_TEXT---", "").strip()
            summary = parts[1].strip()
        else:
            # Fallback if formatting varies slightly
            summary = response_text
            raw_text = "OCR text extraction processed inside summary."

        return {
            "ocr_text": raw_text,
            "ai_summary": summary
        }

    except Exception as e:
        print(f"Error processing document with Gemini: {e}")
        # Return fallback values so the application doesn't crash if the API fails
        return {
            "ocr_text": "Failed to extract text automatically.",
            "ai_summary": "Summary unavailable at this moment."
        }
