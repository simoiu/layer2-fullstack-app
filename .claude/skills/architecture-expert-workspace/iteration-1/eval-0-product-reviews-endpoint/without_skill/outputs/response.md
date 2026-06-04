# Where to Add a New REST Endpoint for Product Reviews

## Task
The user asked: "Where should I add a new REST endpoint for product reviews? Walk me through which files to touch."

## Exploration Transcript

I explored the backend structure at `onlineshopapi/src/main/java/msg/onlineshopapi/` and found the following layers:
- `controller/` — REST endpoints (ProductController, OrderController, AuthController, etc.)
- `service/` — Business logic
- `repository/` — Spring Data JPA repositories
- `model/` — JPA entities
- `dto/` — Request/response DTOs
- `dto/mapper/` — Entity-to-DTO mappers
- `exception/` — Custom exceptions + GlobalExceptionHandler

I also examined the frontend structure at `onlineshopui/src/app/features/products/`, noting:
- `services/product.service.ts` — Handles HTTP calls to `/products`
- `products.routes.ts` — Feature routes
- `core/types/dtos/product.dto.ts` — TypeScript DTO types

I reviewed the Flyway migration files in `onlineshopapi/src/main/resources/db/migration/` to understand the versioning convention (V1, V2, V2.1 for local mock data).

I examined `SecurityConfig.java` to understand which routes are public vs. authenticated.

---

## Answer

Adding a product reviews endpoint follows the same layered pattern used throughout the codebase. Here is every file you need to touch, in order from database up to frontend.

---

### 1. Database Migration — new Flyway SQL file

**File to create:** `onlineshopapi/src/main/resources/db/migration/V3__add_product_reviews.sql`

```sql
CREATE TABLE product_reviews (
    id          UUID          PRIMARY KEY,
    product_id  UUID          NOT NULL REFERENCES products (id),
    user_id     UUID          NOT NULL REFERENCES users (id),
    rating      INTEGER       NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(2000),
    created_at  TIMESTAMP     NOT NULL
);
```

If you also need local mock data, add a companion file:
`onlineshopapi/src/main/resources/db/migration/local/V3.1__populate_mock_reviews.sql`

---

### 2. JPA Entity

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/model/ProductReview.java`

Model the `product_reviews` table. Reference the existing `Product.java` and `User.java` entities for the `@ManyToOne` relationships. Use `@GeneratedValue(strategy = GenerationType.UUID)` for the ID, and `@PrePersist` to set `createdAt` automatically (same pattern as `Order.java`).

---

### 3. Repository

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/repository/ProductReviewRepository.java`

```java
public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {
    List<ProductReview> findByProductId(UUID productId);
}
```

All existing repositories extend `JpaRepository` directly with no custom methods beyond what Spring Data derives. Follow the same pattern.

---

### 4. DTOs

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewRequestDto.java`

Fields: `productId` (UUID), `rating` (int), `comment` (String).

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewResponseDto.java`

Fields: `id`, `productId`, `userId`, `rating`, `comment`, `createdAt`. Use Lombok `@Builder`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor` (same pattern as `ProductResponseDto.java`).

---

### 5. Mapper

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/dto/mapper/ProductReviewMapper.java`

Annotate with `@Component`. Implement `toDto(ProductReview entity)` and `toEntity(ProductReviewRequestDto dto)`. Look at `ProductMapper.java` for the exact pattern — it wires in other mappers via constructor injection and uses the builder pattern.

---

### 6. Service

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/service/ProductReviewService.java`

Annotate with `@Service @RequiredArgsConstructor`. Inject `ProductReviewRepository`. Implement:
- `findByProductId(UUID productId)` — returns list of reviews for a product
- `create(ProductReview review)` — persists a new review

For the `create` method you will need to resolve the current user (via `Principal` passed from the controller or injected via `SecurityContextHolder`) and the target `Product` entity (via `ProductRepository`). Throw `ResourceNotFoundException` if the product doesn't exist — that class already lives in `exception/`.

---

### 7. Controller

**File to create:** `onlineshopapi/src/main/java/msg/onlineshopapi/controller/ProductReviewController.java`

```java
@RestController
@RequestMapping("/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Product review management")
public class ProductReviewController {

    private final ProductReviewService productReviewService;
    private final ProductReviewMapper productReviewMapper;

    @GetMapping
    public List<ProductReviewResponseDto> getByProduct(@PathVariable UUID productId) {
        return productReviewService.findByProductId(productId).stream()
                .map(productReviewMapper::toDto)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ProductReviewResponseDto create(
            @PathVariable UUID productId,
            @RequestBody ProductReviewRequestDto dto,
            Principal principal) {
        // set productId and resolve user from principal inside service
        return productReviewMapper.toDto(productReviewService.create(productId, dto, principal.getName()));
    }
}
```

The `GET` endpoint (reading reviews) should be publicly accessible. The `POST` endpoint (submitting a review) requires authentication (`CUSTOMER` or `ADMIN`).

---

### 8. SecurityConfig — allow public GET on reviews

**File to edit:** `onlineshopapi/src/main/java/msg/onlineshopapi/security/SecurityConfig.java`

In the `securityFilterChain` method, add the reviews path to the `permitAll()` list:

```java
.requestMatchers(
    "/auth/register", "/auth/login",
    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
    "/products", "/products/**", "/suppliers"
).permitAll()
```

Since the reviews endpoint is nested under `/products/**`, it is already covered by the existing `"/products/**"` permit. No change is needed here unless you place reviews at a top-level path like `/reviews`.

---

### 9. Frontend — TypeScript DTO type

**File to edit:** `onlineshopui/src/app/core/types/dtos/product.dto.ts`

Add new types:

```typescript
export type ProductReviewDto = {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
};

export type CreateReviewRequest = {
    productId: string;
    rating: number;
    comment: string;
};
```

---

### 10. Frontend — Review service methods

**File to edit:** `onlineshopui/src/app/features/products/services/product.service.ts`

Add a new Angular service or extend the existing `ProductService` with methods:

```typescript
loadReviews(productId: string): Observable<ProductReviewDto[]> {
    return this.http.get<ProductReviewDto[]>(`${this.productsUrl}/${productId}/reviews`);
}

submitReview(productId: string, data: CreateReviewRequest): Observable<ProductReviewDto> {
    return this.http.post<ProductReviewDto>(`${this.productsUrl}/${productId}/reviews`, data);
}
```

If the reviews logic grows, extract it into a dedicated `review.service.ts` in the same `services/` folder.

---

### 11. Frontend — UI component (optional but expected)

**Directory to add to:** `onlineshopui/src/app/features/products/components/`

Create a `views/product-reviews/` component to display the reviews list and a form to submit a new review. Wire it into the existing `product-detail-page` component.

---

## Summary of files to touch

| # | Action | File |
|---|--------|------|
| 1 | Create | `onlineshopapi/src/main/resources/db/migration/V3__add_product_reviews.sql` |
| 2 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/model/ProductReview.java` |
| 3 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/repository/ProductReviewRepository.java` |
| 4 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewRequestDto.java` |
| 5 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/dto/ProductReviewResponseDto.java` |
| 6 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/dto/mapper/ProductReviewMapper.java` |
| 7 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/service/ProductReviewService.java` |
| 8 | Create | `onlineshopapi/src/main/java/msg/onlineshopapi/controller/ProductReviewController.java` |
| 9 | Edit (maybe) | `onlineshopapi/src/main/java/msg/onlineshopapi/security/SecurityConfig.java` |
| 10 | Edit | `onlineshopui/src/app/core/types/dtos/product.dto.ts` |
| 11 | Edit or create | `onlineshopui/src/app/features/products/services/product.service.ts` (or new `review.service.ts`) |
| 12 | Create | `onlineshopui/src/app/features/products/components/views/product-reviews/` |
