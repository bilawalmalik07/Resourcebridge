import os
import random
import string
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
# use resend.dev for testing, your domain for production
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")


def generate_code(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def send_verification_email(to_email: str, code: str, username: str) -> bool:
    """Send a verification code email via Resend. Returns True on success, False on failure."""
    if not resend.api_key:
        print("RESEND_API_KEY not set — cannot send email.")
        return False

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f7f4; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #1d4ed8; border-radius: 12px; padding: 12px 16px;">
          <span style="color: white; font-size: 20px; font-weight: 900;">ResourceBridge</span>
        </div>
      </div>
      <h2 style="color: #1c1917; font-size: 20px; margin-bottom: 8px;">Hi {username}, verify your email</h2>
      <p style="color: #78716c; font-size: 15px; margin-bottom: 24px;">
        Enter this code to complete your sign-up. It expires in <strong>10 minutes</strong>.
      </p>
      <div style="background: white; border: 2px solid #1d4ed8; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1d4ed8;">{code}</span>
      </div>
      <p style="color: #a8a29e; font-size: 13px; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """

    try:
        params: resend.Emails.SendParams = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Your ResourceBridge Verification Code",
            "html": html,
        }
        response = resend.Emails.send(params)
        print(
            f"Verification email sent to {to_email} — id: {response.get('id')}")
        return True
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")
        return False
