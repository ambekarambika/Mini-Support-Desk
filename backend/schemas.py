from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

class PriorityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class StatusEnum(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

def validate_non_empty(value: str, field_name: str) -> str:
    if not value or not value.strip():
        raise ValueError(f"{field_name} cannot be empty or whitespace-only.")
    return value.strip()

class TicketCreate(BaseModel):
    title: str = Field(..., description="Ticket title")
    client: str = Field(..., description="Client or company name")
    description: Optional[str] = Field(None, description="Optional issue description")
    priority: PriorityEnum = Field(..., description="Ticket priority (Low, Medium, High)")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        return validate_non_empty(v, "Title")

    @field_validator("client")
    @classmethod
    def validate_client(cls, v: str) -> str:
        return validate_non_empty(v, "Client")

class TicketUpdate(BaseModel):
    priority: Optional[PriorityEnum] = Field(None, description="Updated priority")
    status: Optional[StatusEnum] = Field(None, description="Updated status")
    resolution_summary: Optional[str] = Field(None, description="Optional resolution summary when resolving")

class TicketResponse(BaseModel):
    id: int
    title: str
    client: str
    description: Optional[str] = None
    priority: PriorityEnum
    status: StatusEnum
    resolution_summary: Optional[str] = None
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)

class TicketActivityResponse(BaseModel):
    id: int
    ticket_id: int
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AttentionTicketResponse(BaseModel):
    id: int
    title: str
    client: str
    priority: PriorityEnum
    status: StatusEnum
    created_date: datetime
    reason: str

    model_config = ConfigDict(from_attributes=True)
