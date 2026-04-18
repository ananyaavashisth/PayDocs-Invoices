"""
Seed script to populate the PayDocs database with initial data.
Run this to have a business and client ready for testing.
"""

from models import init_db, SessionLocal, Business, Client
from datetime import date

def seed():
    print("🌱 Seeding database...")
    init_db()
    db = SessionLocal()
    
    try:
        # Check if we already have data
        if db.query(Business).count() > 0:
            print("✨ Database already contains data. Skipping seed.")
            return

        # Create a default business
        biz = Business(
            user_id=1,
            name="Alpha Designs Ltd",
            address="789 Innovation Way, Suite 400, San Francisco, CA 94103",
            tax_id="US-99-1234567"
        )
        
        # Create some default clients
        client1 = Client(
            user_id=1,
            name="Acme Corp",
            email="billing@acme.com",
            address="123 Industrial Dr, Chicago, IL 60601"
        )
        
        client2 = Client(
            user_id=1,
            name="Starlight Startup",
            email="accounting@starlight.io",
            address="456 Nebula Ln, Austin, TX 78701"
        )
        
        db.add(biz)
        db.add(client1)
        db.add(client2)
        db.commit()
        
        print(f"✅ Created 1 Business and 2 Clients for user_id=1")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
