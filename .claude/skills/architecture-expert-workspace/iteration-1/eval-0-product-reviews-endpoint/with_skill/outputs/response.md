# Architecture Expert Response: Where to Add a Product Reviews Endpoint

## Work Transcript

### Step 1: Read the skill file
Read `E:\Stuffs\Work\Projects\layer2-fullstack-app\.claude\skills\architecture-expert\SKILL.md`. The skill instructs reading `references/ARCHITECTURE.md` at the start of every session, and provides a decision table: "How do I add a new endpoint?" → migration → entity → repo → DTO → mapper → service → controller → mock handler.

### Step 2: Read the architecture reference
Read `E:\Stuffs\Work\Projects\layer2-fullstack-app\.claude\skills\architecture-expert\references\ARCHITECTURE.md`. Key findings:
- Base package: `msg.onlineshopapi`
- Controllers map to: `/products`, `/auth`, `/categories`, `/orders`
- Existing entities: User, Product, ProductCategory, Location, Stock, Order, OrderDetail
- Flyway migrations in `onlineshopapi/src/main/resources/db/migration/`; current latest is `V2__add_suppliers.sql`
- Security: `permitAll` on `/products` and `/products/**` (public reads); write ops use `@PreAuthorize("hasRole('ADMIN')")`
- Frontend mocks: each feature has a handler in `core/mocks/interceptors/handlers/`

### Step 3: Verified live code
Read the following to confirm current state and patterns:
- `ProductController.java` — request flow, `@PreAuthorize` usage on writes
- `ProductService.java` — no business logic leaking into controller, throws `ResourceNotFoundException`
- `SecurityConfig.java` — current `permitAll` list: `/auth/register`, `/auth/login`, `/products`, `/products/**`, `/suppliers`
- `V2__add_suppliers.sql` — migration pattern; next migration must be `V3__...`
- `ProductService.ts` — Angular service: signals for state, `HttpClient` only in service, not component
- `products-handler.mock.ts` — mock handler pattern, path+method routing
- `products.mock.ts` — seed data pattern

---

## Response

Adding product reviews touches every layer. Here is the exact sequence of files to create or modify, in order, with the rule that governs each one.

---

### 1. Database migration — NEW FILE

**File:** `onlineshopapi/src/main/resources/db/migration/V3__add_product_reviews.sql`

The current latest migration is `V2__add_suppliers.sql`. Next must be `V3`. `ddl-auto` is `validate`, so Flyway owns schema exclusively — never skip this step.

```sql
CREATE TABLE product_reviews (
    id          UUID         PRIMARY KEY,
    product_id  UUID         NOT NULL REFERENCES products(id),
    user_id     UUID         NOT NULL REFERENCES users(id),
    rating      INT          NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

UUID primary key matches the existing entity pattern (`User`, `Product`, `Order` all use UUID PKs).

---

### 2. JPA Entity — NEW FILE

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/model/ProductReview.java`

```java
package msg.onlineshopapi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int rating;

    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
```

`@GeneratedValue(strategy = GenerationType.UUID)` matches `Product`, `Order`, `User`.

---

### 3. Repository — NEW FILE

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/repository/ProductReviewRepository.java`

```java
package msg.onlineshopapi.repository;

import msg.onlineshopapi.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {
    List<ProductReview> findByProductId(UUID productId);
}
```

Repositories are only accessed from the service layer. The controller never touches this.

---

### 4. DTOs — NEW FILES (2)

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewRequestDto.java`

```java
package msg.onlineshopapi.dto;

public record ProductReviewRequestDto(int rating, String comment) {}
```

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewResponseDto.java`

```java
package msg.onlineshopapi.dto;

import java.time.Instant;
import java.util.UUID;

public record ProductReviewResponseDto(
    UUID id,
    UUID productId,
    String reviewerName,   // derived from User.firstName + lastName
    int rating,
    String comment,
    Instant createdAt
) {}
```

Every entity that crosses the API boundary needs a dedicated Request + Response DTO pair. The entity (`ProductReview`) must never leave the service layer.

---

### 5. Mapper — NEW FILE

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/dto/mapper/ProductReviewMapper.java`

```java
package msg.onlineshopapi.dto.mapper;

import msg.onlineshopapi.dto.ProductReviewResponseDto;
import msg.onlineshopapi.model.ProductReview;
import org.springframework.stereotype.Component;

@Component
public class ProductReviewMapper {

    public ProductReviewResponseDto toDto(ProductReview review) {
        return new ProductReviewResponseDto(
            review.getId(),
            review.getProduct().getId(),
            review.getUser().getFirstName() + " " + review.getUser().getLastName(),
            review.getRating(),
            review.getComment(),
            review.getCreatedAt()
        );
    }
}
```

All entity-to-DTO conversion belongs in `dto/mapper/`. Never inline mapping in a controller or service.

---

### 6. Service — NEW FILE

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/service/ProductReviewService.java`

```java
package msg.onlineshopapi.service;

import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.exception.ResourceNotFoundException;
import msg.onlineshopapi.model.Product;
import msg.onlineshopapi.model.ProductReview;
import msg.onlineshopapi.model.User;
import msg.onlineshopapi.repository.ProductRepository;
import msg.onlineshopapi.repository.ProductReviewRepository;
import msg.onlineshopapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<ProductReview> findByProductId(UUID productId) {
        // validates product exists before listing reviews
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        return reviewRepository.findByProductId(productId);
    }

    public ProductReview create(UUID productId, String userEmail, int rating, String comment) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        return reviewRepository.save(ProductReview.builder()
            .product(product)
            .user(user)
            .rating(rating)
            .comment(comment)
            .createdAt(Instant.now())
            .build());
    }
}
```

Business logic (validation, entity lookups) lives here, not in the controller. Throws `ResourceNotFoundException` — `GlobalExceptionHandler` converts that to HTTP 404 automatically.

---

### 7. Controller — NEW FILE

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/controller/ProductReviewController.java`

```java
package msg.onlineshopapi.controller;

import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.dto.ProductReviewRequestDto;
import msg.onlineshopapi.dto.ProductReviewResponseDto;
import msg.onlineshopapi.dto.mapper.ProductReviewMapper;
import msg.onlineshopapi.service.ProductReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/products/{productId}/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService reviewService;
    private final ProductReviewMapper reviewMapper;

    @GetMapping
    public List<ProductReviewResponseDto> getReviews(@PathVariable UUID productId) {
        return reviewService.findByProductId(productId).stream()
            .map(reviewMapper::toDto)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductReviewResponseDto createReview(
            @PathVariable UUID productId,
            @RequestBody ProductReviewRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return reviewMapper.toDto(
            reviewService.create(productId, userDetails.getUsername(), dto.rating(), dto.comment())
        );
    }
}
```

Controller is HTTP-only: parses path variable + body, calls service, maps result. No business logic. The `UserDetails` principal comes from `JwtAuthFilter` which already runs before the controller.

---

### 8. Security — MODIFY EXISTING FILE

**File:** `onlineshopapi/src/main/java/msg/onlineshopapi/security/SecurityConfig.java`

Decide on access model:
- **GET reviews public** (anyone can read reviews, like product list): add `/products/*/reviews` to `permitAll`.
- **POST review requires auth** (any authenticated user, not just ADMIN): this is already covered by `.anyRequest().authenticated()`. No `@PreAuthorize` needed on the POST.

Current `permitAll` line:
```java
.requestMatchers("/auth/register", "/auth/login",
        "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
        "/products", "/products/**", "/suppliers").permitAll()
```

`/products/**` already covers `/products/{id}/reviews` for GET. If you want GET to be public and POST to require login, that pattern already works because the `permitAll` on `GET /products/**` is not method-scoped here. However, `permitAll` currently allows all methods on `GET /products/**` — you may want to tighten this later. For now, POST to a protected endpoint will still require a valid JWT because `JwtAuthFilter` validates before dispatch.

If you want to be explicit and safe, add a method-scoped matcher:
```java
.requestMatchers(HttpMethod.GET, "/products", "/products/**").permitAll()
```

This is the safest option. Making write endpoints `permitAll` by accident is a security hole.

---

### 9. Frontend Angular Service — MODIFY EXISTING FILE

**File:** `onlineshopui/src/app/features/products/services/product.service.ts`

Add review signals and methods inside `ProductService`:

```typescript
// Add to signals section:
private readonly _reviews = signal<ProductReviewDto[]>([]);
readonly reviews = this._reviews.asReadonly();

// Add methods:
loadReviews(productId: string): Observable<void> {
    return this.http.get<ProductReviewDto[]>(`${this.productsUrl}/${productId}/reviews`).pipe(
        tap(reviews => this._reviews.set(reviews)),
        catchError(() => { this._reviews.set([]); return of([]); }),
        map(() => undefined)
    );
}

submitReview(productId: string, rating: number, comment: string): Observable<ProductReviewDto> {
    return this.http.post<ProductReviewDto>(
        `${this.productsUrl}/${productId}/reviews`,
        { rating, comment }
    );
}
```

Reviews are product-scoped, so they belong in `ProductService`. No new service file needed unless reviews grow into a standalone feature. HTTP calls go only through the service — never call `HttpClient` in a component.

---

### 10. Frontend DTO — NEW FILE

**File:** `onlineshopui/src/app/core/types/dtos/product-review.dto.ts`

```typescript
export interface ProductReviewDto {
    id: string;
    productId: string;
    reviewerName: string;
    rating: number;
    comment: string | null;
    createdAt: string; // ISO-8601
}
```

This is a cross-feature type (or at minimum needs to be imported by the product service). If it stays product-only, it can also live in `features/products/` — but since it maps to an API contract, `core/types/dtos/` is the right home.

---

### 11. Mock handler — MODIFY EXISTING FILE

**File:** `onlineshopui/src/app/core/mocks/interceptors/handlers/products-handler.mock.ts`

Add review seed data to `core/mocks/data/products.mock.ts` and two new route branches in `handleProductsFeature`:

```typescript
// In handleProductsFeature, before the final `return null`:
if (method === 'GET' && path.match(/^\/products\/[\w-]+\/reviews$/)) {
    const productId = path.split('/')[2];
    return handleGetReviews(productId);
}

if (method === 'POST' && path.match(/^\/products\/[\w-]+\/reviews$/)) {
    const productId = path.split('/')[2];
    return handleCreateReview(productId, body as { rating: number; comment: string });
}
```

Every new endpoint must have a mock handler. Mock mode must stay fully functional — no empty arrays for seed data.

---

## Complete File Checklist

| Step | Action | File |
|------|--------|------|
| 1 | CREATE | `onlineshopapi/src/main/resources/db/migration/V3__add_product_reviews.sql` |
| 2 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/model/ProductReview.java` |
| 3 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/repository/ProductReviewRepository.java` |
| 4 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewRequestDto.java` |
| 4 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewResponseDto.java` |
| 5 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/dto/mapper/ProductReviewMapper.java` |
| 6 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/service/ProductReviewService.java` |
| 7 | CREATE | `onlineshopapi/src/main/java/msg/onlineshopapi/controller/ProductReviewController.java` |
| 8 | MODIFY | `onlineshopapi/src/main/java/msg/onlineshopapi/security/SecurityConfig.java` |
| 9 | MODIFY | `onlineshopui/src/app/features/products/services/product.service.ts` |
| 10 | CREATE | `onlineshopui/src/app/core/types/dtos/product-review.dto.ts` |
| 11 | MODIFY | `onlineshopui/src/app/core/mocks/interceptors/handlers/products-handler.mock.ts` |
| 11 | MODIFY | `onlineshopui/src/app/core/mocks/data/products.mock.ts` |

---

## Rules Applied

- **Layer boundaries upheld:** Controller has zero business logic. Service owns validation and orchestration. Repository accessed only from service.
- **No entity escapes service:** `ProductReview` entity never returned from service; converted to DTO via mapper before controller returns.
- **Mapper in `dto/mapper/`:** `ProductReviewMapper` lives where all other mappers live (`AuthMapper`, `ProductMapper`, `OrderMapper`, etc.).
- **Typed exceptions only:** `ResourceNotFoundException` thrown from service; `GlobalExceptionHandler` maps it to 404.
- **Flyway owns schema:** `V3__add_product_reviews.sql` is the only valid way to add the table. `ddl-auto` stays `validate`.
- **UUID PKs:** Consistent with all existing entities.
- **`@PreAuthorize` for role enforcement:** POST review does not need ADMIN-only access — any authenticated user can submit. If ADMIN-only moderation endpoints are needed later, add `@PreAuthorize("hasRole('ADMIN')")` on those methods.
- **Security config explicit:** Tighten `permitAll` to `HttpMethod.GET` to avoid accidentally opening POST to unauthenticated callers.
- **Signals in Angular service:** `_reviews` signal with `asReadonly()` exposure follows exact same pattern as `_products`, `_categories`, `_loading`, `_error` already in `ProductService`.
- **Mock handler required:** `handleProductsFeature` extended with review routes; mock mode stays functional.
