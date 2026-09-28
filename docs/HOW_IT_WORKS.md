# Mini Support Desk — How It Works

## 1. Overall System Flow

```
User (Browser) ──> Frontend (HTML/CSS/JS) ──> FastAPI (REST API) ──> PostgreSQL
User (Browser) <── Frontend (HTML/CSS/JS) <── FastAPI (REST API) <── PostgreSQL
```

## 2. Component Workflows

### Dashboard & Statistics
1. On initial load, Vanilla JS calls `GET /api/tickets` and `GET /api/stats`.
2. FastAPI queries PostgreSQL for ticket records and aggregate counts (Total, Open, In Progress, Resolved).
3. JSON responses are returned to the browser.
4. JavaScript updates the dashboard stat cards and renders ticket items dynamically into the list container.

### Ticket Creation
1. User opens the modal form (+ New Ticket) and submits Title, Client, Description, and Priority.
2. JavaScript intercepts submission and sends `POST /api/tickets` with JSON payload.
3. FastAPI validates fields via Pydantic, sets default `status = Open` and timestamps (`created_date`, `updated_date`).
4. SQLAlchemy saves the ticket into PostgreSQL `tickets` table.
5. On success response, frontend closes modal and refreshes dashboard listing and stats.

### Ticket Updates
1. Support staff changes status (e.g., Open -> In Progress) or priority (e.g., Medium -> High).
2. JavaScript sends `PATCH /api/tickets/{ticket_id}`.
3. FastAPI updates PostgreSQL and updates the `updated_date` timestamp.
4. Frontend updates UI state and metrics accordingly.

### Ticket Deletion
1. User clicks Delete on a ticket.
2. Frontend displays confirmation modal ("Delete this ticket? This action cannot be undone.").
3. Upon user confirmation, JS issues `DELETE /api/tickets/{ticket_id}`.
4. FastAPI removes the row from PostgreSQL.
5. Ticket is removed from UI and stats refresh.

### Support Pulse / Attention Queue
1. Frontend requests `GET /api/tickets/attention`.
2. Backend inspects stored tickets against deterministic criteria:
   - High Priority + Open status + Age beyond threshold.
3. Matching tickets are highlighted in the Attention Queue widget on the dashboard.
4. Support staff can directly navigate to and address flagged high-attention items.
