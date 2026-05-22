# Frontend Review Rules

The following rules apply to the `onlineshopui` folder.

---

## Project Structure

### Core (`core/`)
- DTOs - all DTOs must live in `core/types/dtos/`.
- Enums - all shared and DTO-related enums must live in `core/types/enums/`.
- Mocks - test mock data and mock interceptor handlers must live in `core/mocks/`.
- Shared logic (services, providers, config, constants) belongs in `core/`.

### Common Library (`clib/`)
- Reusable, feature-agnostic components and services only.
- Must not contain feature-specific naming (e.g., no `ProductCard` - use `Card`).
- Must not import from `features/`.

### Features (`features/`)
Each feature folder must follow this structure:

```
features/<feature>/
├── components/
│   ├── pages/      # Smart components - contain business logic, call services
│   └── views/      # Presentational components - rendering logic only
├── services/       # Feature-specific services only
├── types/          # Feature-specific types (e.g., view-models, form types)
└── utils/          # Reusable pure functions (e.g., mapping utilities)
```

- Feature modules must not import from other feature modules.
- Feature-specific types (view-models, form types) stay in the feature's `types/` folder, not in `core/types/`.

---

## Subscriptions

All subscriptions must be properly cleaned up. Accepted patterns:

- `takeUntilDestroyed(destroyRef)` - preferred for long-lived subscriptions in components/directives (inject `DestroyRef`).
- `take(1)` - acceptable for one-shot operations (e.g., single HTTP call on init).

---

## Testing

Tests are required for:
- Component pages (`components/pages/`) - every page component must have a `.spec.ts`.
- Services - every service must have a `.spec.ts`.
- Interceptors, guards, and directives - every interceptor, guard, and directive must have a `.spec.ts`.

Testing rules:
- All tests must pass before the change is considered complete:
```bash
  npx ng test --watch=false
```
- Mock data for tests should be placed in `core/mocks/data/`.
- Presentational view components (`components/views/`) do not require tests unless they contain non-trivial logic.
