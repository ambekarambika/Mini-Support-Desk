# AGENTS.md

## Agent Rules

### 1. Scope

- Work only on the requested task.
- Do not expand the project scope without explicit approval.
- Do not add features because they "might be useful."
- If a feature is not required or explicitly approved, do not implement it.

### 2. Do Not Over-Engineer

- Prefer the simplest solution that correctly solves the problem.
- Avoid unnecessary abstractions.
- Avoid unnecessary files.
- Avoid unnecessary dependencies.
- Avoid premature optimization.
- Do not introduce enterprise-level architecture for a small application.

### 3. Technology Constraints

Use only the approved project stack:

- HTML5
- CSS3
- Vanilla JavaScript
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL

Do not introduce another framework, library, service, or infrastructure component without explicit approval.

### 4. Do Not Introduce Unapproved Technologies

Do not add:

- React
- Next.js
- Vue
- Angular
- Redux
- Zustand
- Tailwind CSS
- Bootstrap
- Material UI
- Redis
- Celery
- Kafka
- RabbitMQ
- Kubernetes
- Microservices
- GraphQL
- WebSockets
- Elasticsearch
- OAuth
- JWT
- External AI APIs
- Email systems
- Background workers
- Message queues
- Event-driven architecture

unless explicitly approved.

### 5. Preserve Architecture

- Do not redesign the architecture without approval.
- Do not replace an approved technology with another technology.
- Do not rewrite working code without a clear reason.
- Do not create unnecessary service/repository layers.
- Keep frontend and backend responsibilities separated.

### 6. Work Incrementally

Do not build the entire application at once.

For each meaningful step:

1. Inspect the current code.
2. Explain what needs to change.
3. Explain why it needs to change.
4. Identify the files affected.
5. Make the smallest reasonable change.
6. Run or verify the change.
7. Report what was changed.

Then wait for the next instruction when appropriate.

### 7. Do Not Assume Major Decisions

If a decision could materially affect:

- architecture
- database design
- API design
- technology choice
- project scope

ask before implementing it.

For minor implementation details, choose the simplest reasonable solution.

### 8. Code Quality

Write code that is:

- readable
- simple
- explicit
- maintainable
- consistently structured

Prefer clear code over clever code.

Prefer small functions over unnecessarily complex abstractions.

Use meaningful names.

Avoid duplicated logic where a simple reusable function is appropriate.

### 9. Dependencies

Before adding a dependency:

- Check whether the existing stack can solve the problem.
- If it cannot, explain why the dependency is needed.
- Do not add dependencies merely for convenience.

### 10. Database

- Use PostgreSQL as the database.
- Use SQLAlchemy for database interaction.
- Keep the schema as simple as possible.
- Do not create unnecessary tables.
- Do not hardcode database credentials.
- Never expose database credentials to frontend code.
- Use environment variables for secrets.

### 11. API

- Follow REST conventions.
- Use appropriate HTTP methods.
- Use appropriate HTTP status codes.
- Validate incoming data.
- Return clear errors.
- Do not create duplicate endpoints for the same operation.

### 12. Security

Always:

- validate user input
- use parameterized/ORM database operations
- keep secrets out of source code
- keep `.env` out of Git

Do not add authentication unless explicitly requested.

### 13. Frontend

- Use semantic HTML where practical.
- Keep JavaScript modular and understandable.
- Do not put the entire application into one large JavaScript file.
- Do not add unnecessary animations.
- Do not add decorative UI without a purpose.
- Keep the interface clean and professional.
- Make interactive elements accessible.

### 14. UI Changes

Before making significant visual changes:

- preserve the existing design direction
- avoid unnecessary redesigns
- maintain consistency across pages
- avoid excessive gradients, animations, shadows, and decorative effects

Do not change the overall visual direction without approval.

### 15. Error Handling

- Handle expected errors explicitly.
- Do not silently swallow errors.
- Do not expose raw stack traces to users.
- Show useful user-facing error messages.
- Handle empty states properly.

### 16. Testing

After making a meaningful change:

- run the relevant application/test
- verify that the change works
- check for obvious regressions
- report any remaining issues

Do not claim something works without verifying it when verification is possible.

### 17. Git

Keep commits focused and meaningful.

Do not make unnecessary changes unrelated to the current task.

Do not modify unrelated files.

### 18. AI

AI may assist with implementation, debugging, and code review.

However:

- Do not blindly generate large amounts of code.
- Do not add AI features unless explicitly requested.
- Keep implementations understandable to the developer.
- Prefer simple deterministic logic when AI is unnecessary.

### 19. Documentation

Do not put project explanations, tutorials, or long architectural descriptions inside `AGENTS.md`.

`AGENTS.md` is for agent behavior and constraints only.

Project documentation belongs in separate files.

### 20. Final Rule

When uncertain:

> Choose the simplest solution that works.

Optimize for:

- correctness
- clarity
- maintainability
- usability
- explainability

Not for:

- complexity
- number of technologies
- number of files
- number of features