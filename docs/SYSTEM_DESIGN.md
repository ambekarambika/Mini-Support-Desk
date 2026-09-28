# Mini Support Desk — System Design Document

## 1. Project Overview

Mini Support Desk is a lightweight internal support-ticket management application for teams that need to track and manage client support requests.

The system allows support staff to:
- View support tickets
- Create new tickets
- View individual ticket details
- Update ticket status
- Change ticket priority
- Search tickets
- Filter tickets
- Delete tickets
- View dashboard statistics
- Identify tickets requiring attention via Support Pulse / Attention Queue

The application is intentionally designed as a focused internal tool rather than a full-scale help-desk platform.

## 2. Project Goals

1. Build a functional support-ticket management system.
2. Provide a clean and polished dashboard.
3. Persist ticket data using PostgreSQL.
4. Provide a REST API using FastAPI.
5. Implement complete ticket CRUD operations.
6. Provide useful search and filtering.
7. Handle common edge cases gracefully.
8. Add one meaningful improvement beyond basic requirements (Support Pulse / Attention Queue).
9. Keep the architecture simple enough to understand and explain.

## 3. Functional Requirements

### Dashboard
- Total ticket count
- Open ticket count
- In Progress ticket count
- Resolved ticket count
- Ticket listing
- Search & Filtering
- Attention Queue section

### Ticket Management
- Create ticket
- View ticket
- Update status (Open -> In Progress -> Resolved)
- Update priority (Low, Medium, High)
- Delete ticket with confirmation protection

### Ticket Information Structure
Every ticket contains:
- `id`: Unique identifier
- `title`: String short description
- `client`: Client / company name
- `description`: Detailed issue text
- `priority`: Low | Medium | High
- `status`: Open | In Progress | Resolved
- `created_date`: Timestamp
- `updated_date`: Timestamp

## 4. Ticket Status & Priority Rules

### Statuses
- `Open`: Newly created ticket, pending action.
- `In Progress`: Support staff actively working on ticket.
- `Resolved`: Issue resolved.

### Priorities
- `Low`
- `Medium`
- `High`

Priority is independent of status. For example, `Priority: High` and `Status: Open` means the issue is urgent but work has not started yet.

## 5. High-Level Architecture

The system consists of three primary layers:

```
┌───────────────────────────────────────────┐
│                 FRONTEND                  │
│       HTML5 + CSS3 + Vanilla JS           │
│ (Dashboard, Ticket List, Form, Details)   │
└─────────────────────┬─────────────────────┘
                      │ HTTP / JSON
                      ▼
┌───────────────────────────────────────────┐
│                 BACKEND                   │
│        FastAPI (Python) + Pydantic        │
│   (Routes, Validation, Logic, Errors)     │
└─────────────────────┬─────────────────────┘
                      │ SQL / SQLAlchemy
                      ▼
┌───────────────────────────────────────────┐
│                 DATABASE                  │
│                PostgreSQL                 │
│             (`tickets` table)             │
└───────────────────────────────────────────┘
```

## 6. Database Schema (`tickets`)

- `id`: INTEGER, Primary Key
- `title`: VARCHAR / TEXT, Not Null
- `client`: VARCHAR / TEXT, Not Null
- `description`: TEXT, Not Null
- `priority`: VARCHAR, Not Null ('Low', 'Medium', 'High')
- `status`: VARCHAR, Not Null ('Open', 'In Progress', 'Resolved')
- `created_date`: DATETIME / TIMESTAMP, Not Null
- `updated_date`: DATETIME / TIMESTAMP, Not Null

## 7. API Design Overview

- `GET /api/tickets` — List all tickets (supports search & filter query params)
- `GET /api/tickets/{ticket_id}` — Get single ticket details
- `POST /api/tickets` — Create a new ticket
- `PATCH /api/tickets/{ticket_id}` — Update ticket status or priority
- `DELETE /api/tickets/{ticket_id}` — Delete a ticket
- `GET /api/stats` — Get summary counts (total, open, in_progress, resolved)
- `GET /api/tickets/attention` — Get Attention Queue tickets powered by Support Pulse

## 8. Innovation — Support Pulse / Attention Queue

### Concept
Rather than requiring support staff to manually sift through all open tickets, **Support Pulse** automatically flags tickets needing immediate attention based on deterministic business rules evaluating:
1. Priority (e.g., High priority)
2. Status (e.g., Open)
3. Ticket Age (e.g., created > threshold time ago)

Support Pulse does not automatically alter tickets; it simply surfaces critical items in an Attention Queue view on the dashboard for employee decision-making.

## 9. Error Handling & Delete Protection

- **Delete Protection**: Modal confirmation required before executing ticket deletion to prevent accidental data loss.
- **Validation**: Backend validation using Pydantic ensures invalid priority/status values or empty fields are rejected.
- **Friendly Errors**: Backend returns explicit status codes and error JSON; frontend surfaces readable alerts without exposing raw tracebacks.
