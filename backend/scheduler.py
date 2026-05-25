# Background scheduler for WhatsApp notifications

import time
import os
import threading
from sqlalchemy.orm import Session
from twilio.rest import Client
from backend.database import SessionLocal
from backend.models import NotificationQueue
from dotenv import load_dotenv

# Load env variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

# Enable simulated mode if Twilio parameters are not configured or are placeholder keys
is_simulated = (
    not TWILIO_ACCOUNT_SID or 
    not TWILIO_AUTH_TOKEN or 
    "ACxxxx" in TWILIO_ACCOUNT_SID or 
    "yyyy" in TWILIO_AUTH_TOKEN or
    "your_sid" in TWILIO_ACCOUNT_SID
)

def poll_notifications():
    print("[Scheduler] Notification background worker thread started.")
    if is_simulated:
        print("[Scheduler] Twilio WhatsApp API running in SIMULATED DEVELOPER MODE.")
    else:
        print(f"[Scheduler] Twilio WhatsApp API configured with sender: {TWILIO_WHATSAPP_FROM}")

    while True:
        db = None
        try:
            db = SessionLocal()
            # Fetch pending notifications from the queue (created by DB triggers)
            pending = db.query(NotificationQueue).filter(NotificationQueue.status == 'pending').all()
            
            for notif in pending:
                print(f"[Scheduler] Found pending notification #{notif.notification_id} for phone: {notif.phone}")
                
                if is_simulated:
                    # Log message beautifully in simulated sandbox mode (ASCII-safe for Windows)
                    print("\n" + "="*80)
                    print(f"[SIMULATED WHATSAPP NOTIFICATION TRIGGERED]")
                    print(f"To Recipient Phone: {notif.phone}")
                    print(f"Message Content:")
                    print(f"   {notif.message}")
                    print("="*80 + "\n")
                    notif.status = 'sent'
                else:
                    try:
                        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                        to_number = notif.phone
                        # Ensure WhatsApp formatting
                        if not to_number.startswith("whatsapp:"):
                            to_number = f"whatsapp:{to_number}"
                        
                        client.messages.create(
                            body=notif.message,
                            from_=TWILIO_WHATSAPP_FROM,
                            to=to_number
                        )
                        print(f"[Scheduler] WhatsApp successfully sent via Twilio to {notif.phone}")
                        notif.status = 'sent'
                    except Exception as twilio_err:
                        print(f"[Scheduler] Twilio API error sending to {notif.phone}: {twilio_err}")
                        notif.status = 'failed'
            
            db.commit()
        except Exception as e:
            print(f"[Scheduler] Background thread encountered an error: {e}")
        finally:
            if db:
                db.close()
                
        # Sleep for 10 seconds before polling again
        time.sleep(10)

def start_scheduler():
    thread = threading.Thread(target=poll_notifications, daemon=True)
    thread.start()
