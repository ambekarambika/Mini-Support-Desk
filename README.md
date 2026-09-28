# Mini Support Desk

A lightweight, responsive support-ticket management application built for the **BuiltbyGSV Round 01** assignment. It enables support teams to track, search, filter, update, resolve, and audit client support requests efficiently with an activity timeline, structured resolution workflow, and proactive attention queue.

---

## Assignment Requirements

The table below outlines how each assignment requirement and enhancement is fulfilled in the Mini Support Desk:

| Assignment Requirement | Implementation |
| :--- | :--- |
| **View 8–10 Sample Tickets** | Database seeded with 10 realistic support tickets, sorted descending by creation date. |
| **Create Ticket** | Modal form to submit new tickets with title, client, description, and priority (defaults to `Open`). |
| **View Ticket Details** | Dedicated modal displaying full ticket attributes, resolution records, and activity timeline. |
| **Update Ticket Status** | Transitions between `Open`, `In Progress`, and `Resolved` with mandatory resolution workflow. |
| **Update Ticket Priority** | Real-time adjustment between `Low`, `Medium`, and `High` priorities. |
| **Search Tickets** | Instant search matching partial ticket titles or client names. |
| **Filter Tickets** | Independent or combined filtering by Status (`Open`, `In Progress`, `Resolved`) and Priority (`Low`, `Medium`, `High`). |
| **Delete Ticket** | Ticket removal with inline confirmation prompt and cascading history deletion. |
| **Dashboard Statistics** | Dynamic counter cards displaying `Total`, `Open`, `In Progress`, and `Resolved` ticket metrics. |
| **Primary Additional Improvement** | **Ticket History & Resolution Summary** activity timeline tracking all ticket lifecycle events. |
| **Additional Enhancements** | **Support Pulse** (deterministic attention queue) and **Resolved Ticket Lock & Restart** workflow. |
| **AI Usage Disclosure** | Transparent documentation of AI tools (Google Antigravity & ChatGPT) used during development. |

---

## Features

* **Ticket Listing & Management**: View support tickets ordered by newest first.
* **Create Ticket**: Submit new client requests with required validation.
* **Ticket Details**: Modal view showing ticket metadata, description, resolution history, and timeline.
* **Status Updates**: Update status across ticket lifecycle.
* **Priority Updates**: Adjust urgency levels (`Low`, `Medium`, `High`).
* **Delete Ticket**: Delete tickets with safety confirmation and clean database cleanup.
* **Search**: Real-time debounced search by ticket title or client name.
* **Status Filtering**: Filter ticket list by `Open`, `In Progress`, or `Resolved`.
* **Priority Filtering**: Filter ticket list by `Low`, `Medium`, or `High`.
* **Combined Filtering**: Simultaneously search text and apply status and priority filters.
* **Dashboard Statistics**: Live metrics for Total, Open, In Progress, and Resolved tickets.
* **Support Pulse**: Proactive attention queue highlighting urgent or aged tickets.
* **Ticket History**: Complete activity timeline logging every state change.
* **Resolution Summary**: Mandatory explanation recorded when resolving a ticket.
* **Resolved Ticket Lock**: Read-only lock enforced on resolved tickets.
* **Restart Ticket**: Reopen resolved tickets back to `Open` without losing history or previous resolution.
* **Responsive UI**: Seamlessly adapts across Desktop (1440px), Laptop (1024px), Tablet (768px), and Mobile (390px).
* **Keyboard Accessibility**: Full support for keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`) and visible focus states.

---

## Additional Improvement — Ticket History & Resolution Summary

The primary additional improvement implemented for this project is **Ticket History & Resolution Summary**.

Instead of storing only the current state of a ticket, the system maintains a separate `ticket_activities` audit log that records key lifecycle events:

* **Ticket created**: Logged upon initial creation.
* **Status changed**: Logged when transitioning between statuses (e.g. `Open → In Progress`).
* **Priority changed**: Logged when changing priority (e.g. `Medium → High`).
* **Resolution recorded**: Logged when a ticket is resolved with a resolution summary.
* **Resolution updated**: Logged if the resolution summary is modified.
* **Ticket restarted**: Logged when a resolved ticket is reopened (`Resolved → Open`).

### Resolution Summary Workflow

When a user changes a ticket's status to **Resolved**, the system dynamically prompts for a mandatory **Resolution Summary**:
1. The user must describe how the issue was addressed before saving.
2. Submissions with empty or whitespace-only resolution summaries are blocked with clear validation feedback.
3. Once saved, the resolution is stored in `tickets.resolution_summary` and recorded in the activity log.
4. When inspecting a ticket, the resolution is clearly displayed alongside the full chronological history timeline.

---

## Support Pulse

**Support Pulse** is an additional enhancement that acts as a rule-based attention queue. It highlights support tickets that require urgent intervention based on deterministic criteria:

1. **High Priority + Open**: `High priority ticket is still open`
2. **High Priority + In Progress > 1 Day**: `High priority ticket has been in progress for more than 1 day`
3. **Open > 3 Days**: `Ticket has remained open for more than 3 days`

Support Pulse operates deterministically and transparently without black-box metrics, making queue priorities explainable and predictable for support teams.

---

## Resolved Ticket Lock & Restart

To prevent accidental modification of finalized tickets, the application enforces a **Resolved Ticket Lock & Restart** workflow:

### Locked Resolved State
* Once a ticket is marked **Resolved**, it becomes **read-only**.
* Input fields and select dropdowns for title, client, description, priority, and status are disabled/hidden.
* The `Save Changes` button is omitted.
* The saved resolution summary, metadata, and activity history remain visible.
* **Delete Ticket** remains available.
* **Restart Ticket** becomes available.

### Restart Workflow
If a resolved issue reoccurs or requires further action, the user can click **Restart Ticket**:
1. A confirmation dialog explains that the ticket will return to `Open` while preserving history.
2. Upon confirmation, the ticket status changes from `Resolved → Open`.
3. The existing ticket record is reused; **no duplicate ticket is created**.
4. Previous resolution text and complete activity history are preserved as historical record.
5. A `Ticket restarted` activity (`Resolved → Open`) is logged to the timeline.
6. The ticket becomes fully editable again under normal `Open` / `In Progress` rules.

```
Open  ──>  In Progress  ──>  Resolved  ──>  Restart  ──>  Open
```

---

## Tech Stack

### Frontend
* **HTML5**: Semantic elements and accessible modal dialogs.
* **CSS3**: Vanilla CSS with custom properties (CSS variables), Flexbox/Grid layouts, and accessibility focus states.
* **Vanilla JavaScript (ES6+)**: Asynchronous `fetch` API, DOM manipulation, and debounced input handling.

### Backend
* **Python 3.13**: Core programming language.
* **FastAPI**: Lightweight RESTful Web API framework.
* **Pydantic**: Data validation and response schemas.
* **SQLAlchemy**: Relational Database ORM.

### Database
* **PostgreSQL / Neon PostgreSQL**: Production-grade relational database for persistent storage.

### Development & Testing
* **Git & GitHub**: Version control and source management.
* **FastAPI Swagger / OpenAPI**: Interactive API documentation available at `/docs`.
* **Browser Developer Tools**: DOM inspection and console error monitoring.
* **Python Test Suites**: Integration and endpoint regression testing scripts.

---

## Architecture

The Mini Support Desk uses a clean client-server architecture:

```text
┌─────────────────────────┐
│     Browser Client      │
│  (HTML5 / CSS3 / JS)    │
└────────────┬────────────┘
             │  HTTP / JSON
             ▼
┌─────────────────────────┐
│     FastAPI Backend     │
│   (Python / Pydantic)   │
└────────────┬────────────┘
             │  SQLAlchemy ORM
             ▼
┌─────────────────────────┐
│   PostgreSQL Database   │
│  (Tickets & Activities) │
└─────────────────────────┘
```

* **Frontend Layer**: Renders UI components, manages modal state, formats timestamps, and issues asynchronous requests to the API.
* **Backend Layer**: Enforces business logic, validates payloads via Pydantic, controls state transitions, and manages history logging.
* **Database Layer**: Persists `tickets` and `ticket_activities` tables in PostgreSQL.

---

## Project Structure

```text
Mini Support Desk/
├── AGENTS.md
├── README.md
├── requirements.txt
├── .env
├── .gitignore
├── backend/
│   ├── database.py       # SQLAlchemy engine & session configuration
│   ├── main.py           # FastAPI application & REST endpoints
│   ├── models.py         # SQLAlchemy models (Ticket, TicketActivity)
│   ├── schemas.py        # Pydantic validation schemas & Enums
│   └── seed.py           # Database seeding script (10 sample tickets)
├── frontend/
│   ├── index.html        # Main HTML structure & modals
│   ├── css/
│   │   └── style.css     # Design system, layout, & responsive styling
│   └── js/
│       └── app.js        # Frontend state management & API integration
└── docs/
    ├── HOW_IT_WORKS.md
    ├── SYSTEM_DESIGN.md
    └── TECH_STACK.md
```

---

## How It Works

1. **Page Load**: The browser loads `frontend/index.html` and executes `frontend/js/app.js`.
2. **API Requests**: Asynchronous `fetch` calls request `/api/stats`, `/api/tickets/attention`, and `/api/tickets` from the FastAPI server.
3. **Data Validation**: FastAPI validates incoming JSON requests against Pydantic schemas in `backend/schemas.py`.
4. **Database Operations**: SQLAlchemy ORM queries or mutates records in PostgreSQL (`backend/models.py`).
5. **Activity Audit**: Any ticket state mutation (creation, status update, priority update, resolution, or restart) automatically appends a row to `ticket_activities`.
6. **JSON Response**: The backend returns JSON responses to the frontend.
7. **Dynamic UI Rendering**: Vanilla JavaScript updates dashboard cards, pulse alerts, ticket lists, and modal details without page reloads.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health/db` | Database health check endpoint |
| `GET` | `/api/stats` | Retrieve total, open, in-progress, and resolved ticket counts |
| `GET` | `/api/tickets/attention` | Retrieve Support Pulse attention queue tickets |
| `GET` | `/api/tickets` | List tickets (Supports query params: `search`, `status`, `priority`) |
| `GET` | `/api/tickets/{ticket_id}` | Retrieve details for a specific ticket |
| `POST` | `/api/tickets` | Create a new ticket (Default status: `Open`) |
| `PATCH` | `/api/tickets/{ticket_id}` | Update ticket status, priority, or resolution summary |
| `DELETE` | `/api/tickets/{ticket_id}` | Delete a ticket and cascade delete its history |
| `GET` | `/api/tickets/{ticket_id}/history` | Retrieve activity history timeline for a ticket |
| `GET` | `/docs` | Interactive Swagger / OpenAPI documentation |

---

## Database

The application uses PostgreSQL with two main tables managed via SQLAlchemy:

### 1. `tickets` Table
* `id` (Integer, Primary Key)
* `title` (String, Required)
* `client` (String, Required)
* `description` (Text, Optional)
* `priority` (String: `Low`, `Medium`, `High`)
* `status` (String: `Open`, `In Progress`, `Resolved`)
* `resolution_summary` (Text, Optional)
* `created_date` (DateTime, UTC)
* `updated_date` (DateTime, UTC)

### 2. `ticket_activities` Table
* `id` (Integer, Primary Key)
* `ticket_id` (Integer, Foreign Key referencing `tickets.id`)
* `action` (String: `Ticket created`, `Status changed`, `Priority changed`, `Resolution recorded`, `Resolution updated`, `Ticket restarted`)
* `old_value` (String, Optional)
* `new_value` (String, Optional)
* `created_at` (DateTime, UTC)

Database connection string is configured via the `DATABASE_URL` environment variable in `.env`.

---

## Local Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd "Mini Support Desk"
```

### 2. Create & Activate Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the project root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name?sslmode=require
```
*(You can connect to a local PostgreSQL instance or a cloud Neon PostgreSQL database by providing its connection URI).*

### 5. Start Backend Server
```bash
python -m uvicorn backend.main:app --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`.

### 6. Seed Sample Data
In a separate terminal window, populate the database with 10 sample tickets:
```bash
python -m backend.seed
```

### 7. Launch Frontend
Open `frontend/index.html` directly in your browser or serve it using any static file server (e.g. VS Code Live Server or `python -m http.server`).

---

## API Documentation

FastAPI automatically generates interactive Swagger API documentation accessible when the backend is running:
```text
http://127.0.0.1:8000/docs
```

---

## Testing

The application has undergone thorough API integration testing and browser UI verification:

### Automated & Integration Tests Covered
* **CRUD Ticket Operations**: Ticket creation, fetching, updating, and deletion.
* **Search & Filters**: Title/client search, status filters, priority filters, and multi-filter combinations.
* **Validation**: Input sanitation rejecting whitespace-only titles or missing required resolution text when resolving.
* **Refined Resolution Workflow**: Enforcing mandatory resolution summary before transitioning status to `Resolved`.
* **Resolved Ticket Lock & Restart**: Guarding resolved tickets from direct edit; verifying status return to `Open` without duplicate tickets or data loss.
* **Ticket History & Cascade**: Verifying activity timeline entries and cascade cleanup upon ticket deletion.
* **Dashboard & Support Pulse**: Verifying live statistics updates and attention queue rule matching.

### Verified Responsive Viewports
* **Desktop**: 1440px
* **Laptop**: 1024px
* **Tablet**: 768px
* **Mobile**: 390px

---

## AI Usage

AI tools were used as development assistants throughout the creation of this application:

* **Google Antigravity**:
  * Code implementation assistance across frontend (HTML/CSS/JS) and backend (FastAPI/SQLAlchemy).
  * Automated testing script development and verification execution.
  * UI layout refinement, accessibility enhancements, and responsive breakpoint tuning.
  * Comprehensive README documentation generation.

* **ChatGPT**:
  * Assignment requirement analysis and milestone breakdown.
  * System architecture and database schema design discussions.
  * Brainstorming additional improvements (Ticket History & Support Pulse).
  * Code walkthrough preparation and test edge-case planning.

All AI-generated code and logic were manually reviewed, debugged, and verified through empirical runtime tests before final submission.

---

## Design Decisions

* **Vanilla JavaScript**: Selected to keep the frontend lightweight, fast, transparent, and free from complex build toolchains.
* **FastAPI & Pydantic**: Chosen for high execution speed, strict payload validation, and automatic OpenAPI schema generation.
* **PostgreSQL & SQLAlchemy**: Used to guarantee relational data integrity, parameter query safety against SQL injection, and schema extensibility.
* **Ticket History as Primary Improvement**: Selected because real-world support desks require an audit trail of ticket changes and resolution summaries rather than just static state storage.
* **Deterministic Support Pulse**: Built with transparent, explainable logic to ensure predictable queue prioritizations.
* **Resolved Ticket Lock & Restart**: Designed to prevent accidental edits to closed tickets while allowing seamless reopening without duplicating tickets.

---

## Scope

The following features are intentionally out of scope for this lightweight project:

* User authentication and role-based access control (RBAC)
* Email / SMS notifications
* Real-time WebSocket connections
* Third-party CRM or helpdesk integrations
* Payment processing
* Asynchronous background job queues (e.g. Celery / Redis)
* Microservices architecture
