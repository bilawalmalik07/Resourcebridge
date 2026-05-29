"""
Background thread that checks every 60 seconds for due reminders,
emails the user via Resend, then marks them sent.
"""
import threading
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import models
import email_service
from database import SessionLocal


def _check_and_send():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(models.Reminder).filter(
            models.Reminder.sent == False,
            models.Reminder.remind_at <= now
        ).all()

        for reminder in due:
            user = reminder.owner
            if user and user.email:
                success = email_service.send_reminder_email(
                    to_email=user.email,
                    username=user.username,
                    reminder_text=reminder.text,
                    remind_at=reminder.remind_at,
                )
                if success:
                    reminder.sent = True
                    print(f"Reminder #{reminder.id} sent to {user.email}")
                else:
                    print(f"Reminder #{reminder.id} failed — will retry next cycle")
            else:
                # User has no email — mark sent so we don't loop forever
                reminder.sent = True
                print(f"Reminder #{reminder.id} skipped — user has no email")

        if due:
            db.commit()
    except Exception as e:
        print(f"Scheduler error: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """Call once at app startup to launch the background checker."""
    def loop():
        print("Reminder scheduler started — checking every 60s.")
        while True:
            _check_and_send()
            time.sleep(60)

    t = threading.Thread(target=loop, daemon=True)
    t.start()
