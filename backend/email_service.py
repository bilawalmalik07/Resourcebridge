import os
import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")      # your Gmail address
# Gmail App Password (not your real password)
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def generate_code(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def send_verification_email(to_email: str, code: str, username: str) -> bool:
    """Send a verification code email. Returns True on success, False on failure."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("SMTP_EMAIL or SMTP_PASSWORD not set — cannot send email.")
        return False

    subject = "Your ResourceBridge Verification Code"
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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"Verification email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
