# Architecture

A fullstack e-commerce application — Spring Boot backend, Angular frontend, PostgreSQL database — with JWT authentication and role-based access control.

## Table of contents

- [System overview](#system-overview)
- [Backend](#backend)
- [Frontend](#frontend)
- [Database](#database)
- [Key design patterns](#key-design-patterns)
- [Request flows](#request-flows)

---

## System overview

| Layer    | Technology              | Port  |
|----------|-------------------------|-------|
| Frontend | Angular 21 + Tailwind 4 | 4200  |
| Backend  | Spring Boot 4 (Java 21) | 3000  |
| Database | PostgreSQL 18           | 5433* |

*Docker maps host 5433 → container 5432.

The API is served under the `/api` context path. All protected endpoints require a JWT Bearer token.

---

## Backend

**Base package:** `msg.onlineshopapi`

### Package map

```
msg.onlineshopapi/
├── config/           # OpenAPI/Swagger, CORS
├── controller/       # REST endpoints
├── dto/              # API request/response contracts
│   └── mapper/       # Entity ↔ DTO conversion
├── exception/        # Custom exceptions + global handler
├── model/            # JPA entities
├── repository/       # Spring Data JPA interfaces
├── security/         # JWT filter, Spring Security config
└── service/          # Business logic
    └── strategy/     # Order fulfillment strategies
```

### Controllers

| Controller               | Base path     | Notable operations                              |
|--------------------------|---------------|-------------------------------------------------|
| `AuthController`         | `/auth`       | Register, login (public); profile (protected)   |
| `ProductController`      | `/products`   | Read (all); Create, Update, Delete (ADMIN only) |
| `ProductCategoryController` | `/categories` | Category CRUD (ADMIN write)                  |
| `OrderController`        | `/orders`     | Create (CUSTOMER); read all/by-id               |

### Entities

```
User
├── id (UUID), firstName, lastName, email (unique)
├── password (BCrypt), role (CUSTOMER | ADMIN)

Product
├── id, name, description, price (BigDecimal), weight
├── category (→ ProductCategory), imageUrl

Location (warehouse)
├── id, name, address (embedded Address)

Stock (inventory)
├── PK: (product_id, location_id)
├── quantity

Order
├── id, createdAt, address (embedded Address)
├── user (→ User), orderDetails (→ OrderDetail[])

OrderDetail (line item)
├── PK: (order_id, product_id)
├── shippedFrom (→ Location), quantity
```

`Address` is an `@Embeddable` used in both `Order` and `Location`.

### Security

`JwtAuthFilter` (extends `OncePerRequestFilter`) intercepts every request, extracts the Bearer token, and populates `SecurityContext`. Token expiry is 24 hours.

Public endpoints: `POST /auth/login`, `POST /auth/register`.

Method-level authorization via `@PreAuthorize("hasRole('ADMIN')")` on write operations.

### Order fulfillment strategy

```java
interface OrderStrategy {
    List<Stock> findStocks(Set<OrderDetail> orderDetails);
}
```

| Strategy                 | Behavior                                              |
|--------------------------|-------------------------------------------------------|
| `SingleLocationStrategy` | Fulfills the entire order from one warehouse          |
| `MostAbundantStrategy`   | Selects the warehouse with highest stock per product  |

Configured via `app.order.strategy: SINGLE_LOCATION | MOST_ABUNDANT` in `application.yml`.

### Exception → HTTP status mapping

| Exception                    | Status |
|------------------------------|--------|
| `DuplicateResourceException` | 409    |
| `ResourceNotFoundException`  | 404    |
| `OrderNotProcessableException` | 422  |
| `AccessDeniedException`      | 403    |
| `BadCredentialsException`    | 401    |

---

## Frontend

**Framework:** Angular 21 with standalone components, signals for state, and MSW-style mock mode.

### Directory map

```
src/app/
├── clib/            # Shared component library
│   ├── components/  # card, modal, navbar, spinner, notifications
│   └── layouts/     # root-layout (wraps authenticated pages)
├── core/
│   ├── config/      # Route constants, validation messages, icon imports
│   ├── mocks/       # Mock HTTP interceptor + seed data
│   ├── providers/   # Environment config, validation, mock API
│   ├── services/    # Notification service
│   └── types/       # DTOs, enums, interfaces
└── features/        # Lazy-loaded feature modules
    ├── auth/        # Login, register, guards, JWT interceptor
    ├── cart/        # Cart state (signals + localStorage)
    ├── orders/      # Order list and detail
    └── products/    # Catalog, detail, create, edit
```

### Route tree

```
/auth                   (guestGuard)
  /login
  /register

/                       (authGuard → root-layout)
  /products
    /overview
    /:id
    /create             (rolesGuard: ADMIN)
    /:id/edit           (rolesGuard: ADMIN)
  /cart
    /overview
  /orders
    /overview
    /:id

/**  →  /products/overview
```

### Guards

| Guard        | Purpose                                   |
|--------------|-------------------------------------------|
| `authGuard`  | Requires authenticated user               |
| `guestGuard` | Requires unauthenticated user (auth pages)|
| `rolesGuard` | Requires specific role (e.g., ADMIN)      |

### State management

`CartService` manages cart state with Angular signals. The cart is persisted to `localStorage` and rehydrated on load. Computed signals derive `totalItems` and `totalPrice`.

`AuthService` holds the current user and token as signals. `app.config.ts` registers an app initializer that loads the profile on startup if a token exists.

### Build configurations

Defined in `angular.json`:

| Config        | API source            | Use case            |
|---------------|-----------------------|---------------------|
| `production`  | `${API_URL}` env var  | Production build    |
| `development` | `${API_URL}` env var  | Local dev           |
| `mock`        | MSW interceptor       | UI dev without backend |

---

## Database

### Schema

Flyway migrations in `onlineshopapi/src/main/resources/db/migration/`:

- `V1__create_tables.sql` — full schema
- `V1.1__populate_mock_data.sql` — development seed data (local profile only)

The JPA `ddl-auto` is set to `validate` — Flyway owns schema creation.

### Local connection

```
Host:     localhost:5433
Database: shopdb
User:     shopuser
Password: shoppassword
Schema:   onlineshop (public)
```

Start the database:

```bash
cd docker/development
docker-compose up -d
```

---

## Key design patterns

**JWT stateless auth** — No server-side session. Token in `localStorage`, attached to requests by `AuthTokenInterceptor`, validated per-request by `JwtAuthFilter`.

**DTO + Mapper separation** — Controllers accept/return DTOs; mapper classes (one per domain) handle conversion. Entities never escape the service layer.

**Composite PKs for join tables** — `Stock` and `OrderDetail` use `@EmbeddedId` with `(product_id, location_id)` and `(order_id, product_id)` respectively.

**Transactional order processing** — `OrderService.createOrder` runs in a single `@Transactional` context: resolve user → merge cart duplicates → run fulfillment strategy → persist order + details → decrement stock.

**Lazy-loaded routes** — Feature modules are loaded on first navigation. Auth routes are separate from the main layout shell.

**Mock mode** — `npm run start:mock` replaces HTTP calls with a local interceptor, enabling full UI development without a running backend.

---

## Request flows

### Login

```
POST /auth/login (email, password)
  → AuthController
  → AuthService.login → AuthenticationManager validates credentials
  → JwtService.generateToken (24h expiry)
  ← AuthResponseDto { access_token }
Frontend stores token → authTokenInterceptor attaches on all future requests
```

### Create order

```
POST /orders (cart items)
  → JwtAuthFilter validates token
  → OrderController → OrderService.createOrder
      1. Resolve User by email
      2. Merge duplicate cart items
      3. OrderStrategy.findStocks → selects fulfillment locations
      4. Persist Order + OrderDetails
      5. Decrement Stock quantities
  ← OrderResponseDto
```

### Admin product write

```
POST /products (product data)
  → JwtAuthFilter validates token
  → @PreAuthorize("hasRole('ADMIN')") checked
  → ProductController → ProductService.save
  → ProductMapper converts RequestDto → entity
  → Repository persists
  ← ProductResponseDto
```
