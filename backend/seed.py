from datetime import datetime, timezone, timedelta
from backend.database import SessionLocal, engine
from backend.models import Base, Ticket

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Ticket).first() is not None:
            print("Tickets already exist. Seed skipped.")
            return

        now = datetime.now(timezone.utc)

        sample_tickets = [
            # 1. High + Open (Recent) -> Support Pulse Rule 1
            Ticket(
                title="Payment gateway error on checkout",
                client="Acme Corp",
                description="Clients reporting 500 error when processing credit card payments.",
                priority="High",
                status="Open",
                created_date=now - timedelta(hours=2),
                updated_date=now - timedelta(hours=2)
            ),
            # 2. High + In Progress (>1 day old) -> Support Pulse Rule 2
            Ticket(
                title="Unable to access admin dashboard",
                client="NovaTech Solutions",
                description="Administrator user accounts getting access denied on login.",
                priority="High",
                status="In Progress",
                created_date=now - timedelta(days=2),
                updated_date=now - timedelta(hours=5)
            ),
            # 3. Medium + Open (>3 days old) -> Support Pulse Rule 3
            Ticket(
                title="Report export timing out for large date ranges",
                client="GreenLeaf Retail",
                description="PDF report generation fails when selecting date range > 6 months.",
                priority="Medium",
                status="Open",
                created_date=now - timedelta(days=4),
                updated_date=now - timedelta(days=4)
            ),
            # 4. Low + Open (>3 days old) -> Support Pulse Rule 3
            Ticket(
                title="Notification emails not being received",
                client="BrightPath Systems",
                description="Email alerts for system updates are delayed or going to spam.",
                priority="Low",
                status="Open",
                created_date=now - timedelta(days=5),
                updated_date=now - timedelta(days=5)
            ),
            # 5. High + Resolved (Old) -> Excluded from Support Pulse
            Ticket(
                title="Database sync connection drop",
                client="Apex Logistics",
                description="Primary database lost replica connection during nightly maintenance.",
                priority="High",
                status="Resolved",
                created_date=now - timedelta(days=6),
                updated_date=now - timedelta(days=1)
            ),
            # 6. Medium + In Progress (Recent) -> Normal Ticket
            Ticket(
                title="User permissions not updating after role change",
                client="BlueSky Finance",
                description="Role changes in user management take hours to reflect in UI.",
                priority="Medium",
                status="In Progress",
                created_date=now - timedelta(hours=12),
                updated_date=now - timedelta(hours=2)
            ),
            # 7. Low + Open (Recent) -> Normal Ticket
            Ticket(
                title="Invoice download PDF formatting alignment",
                client="Acme Corp",
                description="Company logo overlaps tax total on generated PDF invoices.",
                priority="Low",
                status="Open",
                created_date=now - timedelta(hours=4),
                updated_date=now - timedelta(hours=4)
            ),
            # 8. Medium + Resolved (Recent) -> Normal Resolved Ticket
            Ticket(
                title="Dashboard data metrics not auto-refreshing",
                client="NovaTech Solutions",
                description="Widget cards require browser refresh to update live counts.",
                priority="Medium",
                status="Resolved",
                created_date=now - timedelta(days=1),
                updated_date=now - timedelta(hours=3)
            ),
            # 9. High + Open (>5 days old) -> Support Pulse Rule 1 & 3
            Ticket(
                title="API integration authentication 401 error",
                client="BrightPath Systems",
                description="Partner REST API integration failing Bearer token authentication.",
                priority="High",
                status="Open",
                created_date=now - timedelta(days=6),
                updated_date=now - timedelta(days=6)
            ),
            # 10. Low + Resolved (3 days old) -> Normal Resolved Ticket
            Ticket(
                title="Account settings timezone preferences not saving",
                client="Apex Logistics",
                description="User profile timezone reverts to UTC after saving settings.",
                priority="Low",
                status="Resolved",
                created_date=now - timedelta(days=3),
                updated_date=now - timedelta(days=2)
            ),
        ]

        db.add_all(sample_tickets)
        db.commit()
        print("Successfully seeded 10 sample support tickets into the database.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
