# Mini Support Desk — Technology Stack

## Approved Technology Stack

### 1. Frontend
- **HTML5**: Structural markup for dashboard, ticket lists, creation/edit forms, and ticket details.
- **CSS3**: Custom Vanilla CSS for responsive layout, typography, status badges, priority colors, dark/light themes, and UI cards. (No external CSS frameworks like Tailwind or Bootstrap).
- **Vanilla JavaScript**: DOM manipulation, async HTTP requests (`fetch`), form handling, search/filter state, and interactive modal dialogs. (No JS frameworks like React, Vue, or Angular).

### 2. Backend
- **Python**: Core programming language.
- **FastAPI**: Modern, fast web framework for building REST APIs. Handles routing, HTTP requests/responses, and exception handling.
- **Pydantic**: Data validation and schema definitions for incoming requests and outgoing API responses.
- **SQLAlchemy**: ORM / SQL query abstraction layer for structured database interaction.

### 3. Database
- **PostgreSQL**: Relational database management system for persistent storage of support tickets.
- **Database Driver**: `psycopg2-binary` (or standard PostgreSQL driver) for Python database connectivity.

### 4. Development & Testing
- **VS Code**: Primary code editor.
- **Git / GitHub**: Source control management.
- **FastAPI Swagger UI**: Interactive API documentation available out-of-the-box at `/docs`.
- **Browser Developer Tools**: Inspection of network requests, DOM elements, and console logs.

## Constraints & Exclusions

In accordance with project rules (`AGENTS.md`), the following technologies are strictly prohibited:
- Frontend frameworks (React, Vue, Next.js, Angular)
- CSS frameworks (Tailwind CSS, Bootstrap, Material UI)
- External AI APIs or services
- Event queues, background workers, microservice infrastructure (Redis, Celery, Kafka, RabbitMQ)
- Authentication / OAuth systems (unless explicitly requested in future scope)
