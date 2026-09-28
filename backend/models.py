from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, ForeignKey, func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    client = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Open")
    resolution_summary = Column(Text, nullable=True)
    created_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    activities = relationship("TicketActivity", back_populates="ticket", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(priority.in_(["Low", "Medium", "High"]), name="check_priority_values"),
        CheckConstraint(status.in_(["Open", "In Progress", "Resolved"]), name="check_status_values"),
    )

class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    ticket = relationship("Ticket", back_populates="activities")
