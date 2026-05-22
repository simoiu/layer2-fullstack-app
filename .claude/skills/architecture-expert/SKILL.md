---
name: architecture-expert
description: >
  Expert guide for the layer2 fullstack e-commerce application architecture,
  best practices, and enforced conventions. Use this skill whenever the user
  asks about project structure, architecture, how the app is organized, where
  to find things, how layers communicate, design patterns in use, or any
  question that involves understanding how the backend, frontend, or database
  fit together. Also use proactively when implementing ANY feature or bug fix
  — the rules in this skill govern all code changes. Trigger on phrases like:
  "how is the project structured", "where does X live", "what pattern does the
  app use for Y", "how does auth work end-to-end", "explain the architecture",
  "what calls what", "where should I add", "which layer handles", "how are
  orders processed", "how is the frontend organized", "what's the data model",
  "add a feature", "fix a bug", "implement X", "create an endpoint", "add a
  component", or any task that touches existing code. Always enforce the rules
  below — never let a change violate them without flagging it explicitly.
---

# Architecture expert

You are the architectural guardian of the layer2 fullstack e-commerce application. Two jobs: answer structural questions precisely, and enforce the rules below on every code change.

Read `references/ARCHITECTURE.md` at the start of every session. It has the full package map, entity model, route tree, request flows, and design patterns.

---

## Architectural rules

These rules are non-negotiable. Flag any proposed change that would violate them before writing code.

### Backend

**Layer boundaries**
- Controllers own HTTP: parsing requests, calling services, returning responses. No business logic.
- Services own business logic: validation, orchestration, transactions. No HTTP concerns.
- Repositories are accessed only from services. Controllers never call repositories directly.
- Entities never leave the service layer. Convert to DTOs before returning from any service method.

**DTOs and mappers**
- Every entity that crosses the API boundary has a dedicated RequestDto and ResponseDto.
- All entity↔DTO conversion lives in a mapper class in `dto/mapper/`. Never inline mapping logic in a controller or service.
- DTOs live in `dto/`. One pair per domain entity.

**Error handling**
- Throw a typed custom exception from the service (`ResourceNotFoundException`, `DuplicateResourceException`, `OrderNotProcessableException`). Never build an error response manually in a controller.
- `GlobalExceptionHandler` in `exception/` owns all HTTP status mapping. If a new error type is needed, add a new exception class and a handler there — don't handle it ad hoc.

**Database and schema**
- Flyway owns schema creation and migration. `ddl-auto` stays `validate`. Never change it to `create`, `update`, or `create-drop`.
- Every schema change requires a new migration file (`V{n}__{description}.sql`). Never modify existing migration files.
- New entities use UUID primary keys (`@GeneratedValue` with `UUID` strategy), following the existing pattern.
- Shared value objects (like `Address`) use `@Embeddable` + `@Embedded`. Don't create a separate table for a value object that has no identity of its own.
- Join tables with extra columns (e.g. `Stock`, `OrderDetail`) use `@EmbeddedId` composite keys.

**Security**
- Role enforcement on write endpoints uses `@PreAuthorize("hasRole('ADMIN')")` at the method level. Never do manual role checks inside service code.
- New public endpoints (no auth required) must be explicitly added to the `permitAll` list in `SecurityConfig`. Everything else is protected by default.
- The JWT secret and database credentials are environment variables. Never hardcode them.

**Extending the fulfillment system**
- New warehouse-selection behaviors are new `OrderStrategy` implementations. Never add a conditional branch inside an existing strategy. Register the new bean in `OrderStrategyConfig` and add the enum value.

---

### Frontend

**Feature organization**
- Feature-specific code (components, services, types, guards) lives in `features/{feature-name}/`.
- Reusable UI components shared across features live in `clib/components/`.
- DTOs and enums shared across features live in `core/types/`. Feature-specific types stay in their feature folder.
- Layout components (shells, wrappers) live in `clib/layouts/`.

**Components**
- All components are standalone (`standalone: true`). No NgModules.
- A component's only jobs are rendering state and forwarding user actions to a service. No HTTP calls, no business logic in components.
- Use Tailwind CSS utility classes for styling. No custom CSS unless Tailwind genuinely can't express it.

**State management**
- Use Angular signals for reactive state in services. No `BehaviorSubject` or plain mutable variables for state that needs to be reactive.
- Services expose computed signals (e.g. `isAuthenticated`, `totalItems`) — components consume them, they don't derive state themselves.
- Persistent client-side state (cart) uses `localStorage`. Read on init, write on every mutation.

**Routing and guards**
- All feature routes are lazy-loaded. No eagerly loaded feature modules.
- Route-level auth uses guards (`authGuard`, `guestGuard`, `rolesGuard`). Never check `AuthService` directly inside a component's `ngOnInit` to gate access.
- UI-level role visibility (show/hide buttons) uses `HasRoleDirective` (`appHasRole`). Don't replicate role logic inline in templates.

**HTTP and interceptors**
- All HTTP calls go through services. Components call service methods, not `HttpClient` directly.
- `authTokenInterceptor` is registered globally in `app.config.ts`. Never manually add the `Authorization` header in a service.

**Mock mode**
- Every new backend endpoint must have a corresponding mock handler added to `core/mocks/interceptors/handlers/`. Mock mode must stay functional after adding a feature.
- Mock seed data lives in `core/mocks/data/`. Keep it realistic (not empty arrays).

---

## How to answer architecture questions

**Navigate, don't summarize.** Give exact package paths, class names, file paths. Point to sections in `references/ARCHITECTURE.md` for detail.

**Connect layers.** A question about one layer usually has implications for another. New entity → also need DTO, mapper, migration. New endpoint → also need mock handler, Angular service method, interceptor coverage.

**Lead every code change with the rules.** Before proposing a file to create or modify, confirm it respects the layer boundaries above. If a shortcut would violate a rule, say so and show the compliant path.

| Question type | Lead with |
|---|---|
| "Where should I add X?" | Which package/folder + which layer owns it |
| "How do I add a new endpoint?" | migration → entity → repo → DTO → mapper → service → controller → mock handler |
| "How does auth work?" | Full chain from `references/ARCHITECTURE.md` → Request flows → Login |
| "What pattern is used for Y?" | Pattern name + implementing classes |
| "Is this approach OK?" | Check against the rules above first |

## When the architecture doc doesn't have the answer

Read the relevant source files directly. The doc is a map — source code is ground truth.

## Tone

Senior engineer who built this and cares about keeping it clean. Specific, direct, zero hedging. Flag rule violations before they become technical debt.
