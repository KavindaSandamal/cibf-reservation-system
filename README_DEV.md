# CIBF Reservation System Backend Developer Guide

## Project Structure

```
backend/
  src/main/java/com/cibf/
    controller/    # REST API endpoints
    dto/           # Data Transfer Objects (API payloads)
    entity/        # JPA entities (models/tables)
    repository/    # Spring Data JPA repository interfaces
    security/      # JWT/Spring Security configs and filters
    service/       # Business logic, service layer
    reservation/backend/
      BackendApplication.java # Main entry point
  src/main/resources/
    application.properties  # DB & env configs
build.gradle
```

## Core Principles
- Spring Boot 3.x, Java 17+, PostgreSQL
- Layered architecture (Controller → Service → Repository → Entity)
- JWT authentication and role-based access control (VENDOR, EMPLOYEE, ADMIN)
- Type-safe roles (`Role` enum, no magic strings)
- OOP & SOLID: Separation of concerns, DTOs for every inbound/outbound payload

## Key Files/Patterns
- **Entities**: Extend existing examples (`User`, `Employee`). Use `@Entity`, keep fields private, use `lombok` where possible.
- **Repositories**: Extend `JpaRepository<>`; follow existing pattern (`UserRepository`, etc.).
- **Services**: Put business logic here, do NOT bloat controllers. Use interfaces for abstraction.
- **Controllers**: Only thin REST endpoint handlers.
- **Security**: See `security/` folder for JWT, filter, and CSRF/CORS configuration examples.
- **DTOs**: All input/output goes through DTOs, not entities.

## Adding a New Feature Example (e.g., Stalls)

1. **Entity**: Create `Stall.java` in `entity/`
   - Annotate with `@Entity`
   - Add fields (id, name, size, location, status, etc.)

2. **Repository**: Create `StallRepository.java` in `repository/`
   - `interface StallRepository extends JpaRepository<Stall, Long>`

3. **DTOs**: Create/update DTOs in `dto/` as needed

4. **Service**: Create `StallService` interface + implementation in `service/`
   - Inject repo
   - Write CRUD logic, validators (e.g., 3-stall limit)

5. **Controller**: Add `StallController` in `controller/`
   - Expose endpoints (GET/POST/PUT/DELETE /api/stalls)
   - Validate requests, delegate to service

6. **Security**: Control access with roles using method-level `@PreAuthorize`, if needed

## Developer Workflow
1. Always branch off `feature/*` or similar; never work directly on main
2. Follow the detailed commit message pattern (atomic changes, clear intent)
3. Test endpoints using Postman/Insomnia or curl (see README for example JSON bodies)
4. Run/stop with `./gradlew bootRun` in `backend/`
5. If you change DB constraints, coordinate or add migration scripts
6. Add/commit code in logical chunks (grouped by feature)
7. Document new endpoints clearly in code & README if public-facing
8. Use `pgAdmin` or DBeaver for DB management. DB default is: `postgres:postgres@localhost:5432/cibf_db`

## Security & Quality Standards
- Passwords are ALWAYS hashed using BCrypt
- NEVER expose entity objects directly in your controllers
- All new API input should be validated with annotations (e.g., `@NotBlank`, `@Email`)
- Use Java enums, never role strings/ids directly
- Granular error handling: Use `ResponseStatusException`/custom exceptions for business rule violations
- Write and annotate new services/interfaces per standard patterns

## API Conventions
- RESTful uri coming from `/api/...`, e.g. `/api/stalls`, `/api/reservations`
- Use JWT from `/api/auth/*` endpoints, include in `Authorization: Bearer <token>`


---
