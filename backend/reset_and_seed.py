"""
Script to reset the PayDocs database and seed it with 5 Businesses and 5 Clients.
Used to prepare for a clean walkthrough video.
"""

import os
import sys
from models import init_db, SessionLocal, Business, Client

def reset_and_seed():
    print("🧹 Cleaning up old database files...")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "paydocs.db")
    
    for f in [DB_PATH, f"{DB_PATH}-wal", f"{DB_PATH}-shm"]:
        if os.path.exists(f):
            os.remove(f)
            print(f"   Deleted {f}")

    print("🌱 Initializing new database...")
    init_db()
    db = SessionLocal()
    
    try:
        # 5 New Businesses
        businesses = [
            Business(user_id=1, name="Global Architects", address="101 Skyline Dr, New York, NY 10001", tax_id="TAX-GA-001"),
            Business(user_id=1, name="Nexus Software Solutions", address="202 Code Lane, San Francisco, CA 94107", tax_id="TAX-NSS-002"),
            Business(user_id=1, name="Zenith Marketing", address="303 Brand Way, London, UK EC1V", tax_id="TAX-ZM-003"),
            Business(user_id=1, name="Oceanic Logistics", address="404 Port Rd, Singapore 117440", tax_id="TAX-OL-004"),
            Business(user_id=1, name="Emerald Real Estate", address="505 Green St, Sydney, NSW 2000", tax_id="TAX-ERE-005"),
        ]
        
        # 5 New Clients
        clients = [
            Client(user_id=1, name="BlueSky Media", email="billing@bluesky.com", address="77 Cloud Ave, Denver, CO 80202"),
            Client(user_id=1, name="Terra Firma Construction", email="accounts@terrafirma.com", address="88 Ground Rd, Seattle, WA 98101"),
            Client(user_id=1, name="Velocity Auto Parts", email="payments@velocity.io", address="99 Speed Blvd, Detroit, MI 48226"),
            Client(user_id=1, name="Modern Interiors", email="invoiced@modern.design", address="111 Style Sq, Milan, Italy"),
            Client(user_id=1, name="QuickSilver Tech", email="fin@quicksilver.tech", address="222 Agile Way, Berlin, Germany"),
        ]

        db.add_all(businesses)
        db.add_all(clients)
        db.commit()
        
        print(f"✅ Created {len(businesses)} Businesses and {len(clients)} Clients for user_id=1")
        print("🚀 Database is clean and ready for the walkthrough!")
        
    except Exception as e:
        print(f"❌ Error during reset/seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
