from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, or_, func
from sqlalchemy.exc import SQLAlchemyError

from backend.database import get_db, engine
from backend.models import Base, Ticket, TicketActivity
from backend.schemas import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketActivityResponse,
    AttentionTicketResponse,
    StatusEnum,
    PriorityEnum
)

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_summary TEXT;"))
            conn.commit()
    except Exception:
        pass

init_db()

app = FastAPI(title="Mini Support Desk API")

# Explicit CORS origins for local development (supports http origins and local file:// origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "null",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    ],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Mini Support Desk API is running"}

@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        init_db()
        db.execute(text("SELECT 1"))
        return {"status": "success", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        total = db.query(func.count(Ticket.id)).scalar() or 0
        open_count = db.query(func.count(Ticket.id)).filter(Ticket.status == StatusEnum.OPEN.value).scalar() or 0
        in_progress_count = db.query(func.count(Ticket.id)).filter(Ticket.status == StatusEnum.IN_PROGRESS.value).scalar() or 0
        resolved_count = db.query(func.count(Ticket.id)).filter(Ticket.status == StatusEnum.RESOLVED.value).scalar() or 0

        return {
            "total": total,
            "open": open_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate statistics due to database error."
        )

@app.post("/api/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    try:
        new_ticket = Ticket(
            title=ticket_in.title,
            client=ticket_in.client,
            description=ticket_in.description,
            priority=ticket_in.priority.value if hasattr(ticket_in.priority, "value") else str(ticket_in.priority),
            status=StatusEnum.OPEN.value
        )
        db.add(new_ticket)
        db.flush()

        activity = TicketActivity(
            ticket_id=new_ticket.id,
            action="Ticket created",
            old_value=None,
            new_value=None
        )
        db.add(activity)
        db.commit()
        db.refresh(new_ticket)
        return new_ticket
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create ticket due to database error."
        )

@app.get("/api/tickets", response_model=list[TicketResponse])
def get_tickets(
    search: Optional[str] = None,
    status_filter: Optional[StatusEnum] = Query(None, alias="status"),
    priority_filter: Optional[PriorityEnum] = Query(None, alias="priority"),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Ticket)

        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Ticket.title.ilike(search_pattern),
                    Ticket.client.ilike(search_pattern)
                )
            )

        if status_filter:
            status_val = status_filter.value if hasattr(status_filter, "value") else str(status_filter)
            query = query.filter(Ticket.status == status_val)

        if priority_filter:
            priority_val = priority_filter.value if hasattr(priority_filter, "value") else str(priority_filter)
            query = query.filter(Ticket.priority == priority_val)

        tickets = query.order_by(Ticket.created_date.desc()).all()
        return tickets
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tickets due to database error."
        )

@app.get("/api/tickets/attention", response_model=list[AttentionTicketResponse])
def get_attention_tickets(db: Session = Depends(get_db)):
    try:
        now = datetime.now(timezone.utc)
        tickets = db.query(Ticket).filter(Ticket.status != StatusEnum.RESOLVED.value).all()

        attention_list = []
        for ticket in tickets:
            created = ticket.created_date
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)

            age = now - created
            reason = None

            if ticket.priority == PriorityEnum.HIGH.value and ticket.status == StatusEnum.OPEN.value:
                reason = "High priority ticket is still open"
            elif ticket.priority == PriorityEnum.HIGH.value and ticket.status == StatusEnum.IN_PROGRESS.value and age > timedelta(days=1):
                reason = "High priority ticket has been in progress for more than 1 day"
            elif ticket.status == StatusEnum.OPEN.value and age > timedelta(days=3):
                reason = "Ticket has remained open for more than 3 days"

            if reason:
                attention_list.append({
                    "id": ticket.id,
                    "title": ticket.title,
                    "client": ticket.client,
                    "priority": ticket.priority,
                    "status": ticket.status,
                    "created_date": ticket.created_date,
                    "reason": reason
                })

        priority_order = {PriorityEnum.HIGH.value: 1, PriorityEnum.MEDIUM.value: 2, PriorityEnum.LOW.value: 3}
        attention_list.sort(key=lambda t: (priority_order.get(t["priority"], 99), t["created_date"]))

        return attention_list
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attention tickets due to database error."
        )

@app.get("/api/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        return ticket
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve ticket due to database error."
        )

@app.get("/api/tickets/{ticket_id}/history", response_model=list[TicketActivityResponse])
def get_ticket_history(ticket_id: int, db: Session = Depends(get_db)):
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        activities = db.query(TicketActivity).filter(TicketActivity.ticket_id == ticket_id).order_by(TicketActivity.created_at.desc()).all()
        return activities
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve ticket history due to database error."
        )

@app.patch("/api/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, ticket_in: TicketUpdate, db: Session = Depends(get_db)):
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        update_data = ticket_in.model_dump(exclude_unset=True)
        if not update_data:
            return ticket

        old_status = ticket.status
        old_res_summary = ticket.resolution_summary
        new_res_summary = None
        if "resolution_summary" in update_data and update_data["resolution_summary"] is not None:
            new_res_summary = update_data["resolution_summary"].strip()

        # If currently Resolved, enforce lock unless performing a Restart (status -> Open)
        if old_status == StatusEnum.RESOLVED.value:
            new_status = update_data.get("status")
            new_status_val = new_status.value if hasattr(new_status, "value") else (str(new_status) if new_status is not None else None)

            if new_status_val == StatusEnum.OPEN.value:
                activity = TicketActivity(
                    ticket_id=ticket.id,
                    action="Ticket restarted",
                    old_value=StatusEnum.RESOLVED.value,
                    new_value=StatusEnum.OPEN.value
                )
                db.add(activity)
                ticket.status = StatusEnum.OPEN.value
                ticket.updated_date = datetime.now(timezone.utc)
                db.commit()
                db.refresh(ticket)
                return ticket
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Resolved tickets are locked and cannot be edited. Use Restart Ticket to reopen."
                )

        if "status" in update_data and update_data["status"] is not None:
            new_status_val = update_data["status"].value if hasattr(update_data["status"], "value") else str(update_data["status"])
            if new_status_val != ticket.status:
                if new_status_val == StatusEnum.RESOLVED.value:
                    if not new_res_summary:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Please describe how the issue was resolved."
                        )

                activity = TicketActivity(
                    ticket_id=ticket.id,
                    action="Status changed",
                    old_value=ticket.status,
                    new_value=new_status_val
                )
                db.add(activity)
                ticket.status = new_status_val

        if "priority" in update_data and update_data["priority"] is not None:
            new_priority_val = update_data["priority"].value if hasattr(update_data["priority"], "value") else str(update_data["priority"])
            if new_priority_val != ticket.priority:
                activity = TicketActivity(
                    ticket_id=ticket.id,
                    action="Priority changed",
                    old_value=ticket.priority,
                    new_value=new_priority_val
                )
                db.add(activity)
                ticket.priority = new_priority_val

        if new_res_summary:
            if not old_res_summary:
                res_activity = TicketActivity(
                    ticket_id=ticket.id,
                    action="Resolution recorded",
                    old_value=None,
                    new_value=new_res_summary
                )
                db.add(res_activity)
                ticket.resolution_summary = new_res_summary
            elif new_res_summary != old_res_summary:
                res_activity = TicketActivity(
                    ticket_id=ticket.id,
                    action="Resolution updated" if ticket.status == StatusEnum.RESOLVED.value else "Resolution recorded",
                    old_value=old_res_summary,
                    new_value=new_res_summary
                )
                db.add(res_activity)
                ticket.resolution_summary = new_res_summary

        ticket.updated_date = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ticket)
        return ticket
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ticket due to database error."
        )

@app.delete("/api/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        db.query(TicketActivity).filter(TicketActivity.ticket_id == ticket_id).delete()
        db.delete(ticket)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete ticket due to database error."
        )
