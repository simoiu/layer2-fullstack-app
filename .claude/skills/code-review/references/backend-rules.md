# Backend Review Rules

The following rules apply to the `onlineshopapi` folder.

---

## Entities & Migrations
- Any change (add/modify/delete) to a model in `/src/main/java/msg/onlineshopapi/model/` requires a corresponding Flyway migration in `/src/main/resources/db/migration/`.
- Mock data migration files for local development must also be updated under `src/main/resources/db/migration/local`.
- Migration filenames must follow the Flyway convention: `V{version}__{description}.sql`.

## Annotations
- No redundant annotations (e.g., `@Repository` is not needed on interfaces extending `JpaRepository`; `@Column(name = "...")` should only be used to override the default naming strategy, not to repeat the default.)

## Secrets & Configuration
- `/src/main/resources/application.yml` must never contain plain secrets - use `${ENV_VAR}` placeholders.
- Plain secrets are only allowed in `/src/main/resources/application-local.yml`.

## Dependency Injection
- Always use `@RequiredArgsConstructor` on the class with `private final` fields.
- Never use `@Autowired` in production code. It is acceptable only in tests.

## Layer Separation
- Controllers (`controller/`) must never expose model entities - only DTOs from `dto/`. Ensure no business logic is present in controllers.
- Services (`service/`) must never accept or return DTOs - only entities or primitive types.
- Mappers (`dto/mapper/`) are pure, stateless components:
    - No dependency on services.
    - May only depend on models, DTOs, or other mappers.
    - Use `@Builder` for constructing objects.
    - Annotate with `@Component` (not `@Service`).

## Error Handling
- Services should throw domain-specific exceptions (e.g., `ResourceNotFoundException`).
- Services and controllers should avoid containing try/catch blocks - use a global `@ControllerAdvice` handler.

## Testing
- Every change to `controller/` requires a corresponding test update in `src/test/java/msg/onlineshopapi/controller/`.
- All tests must pass before the change is considered complete:
```bash
  mvn test
```