# How Auth Works End-to-End

This answer traces the full auth chain, from source code, following the architecture documented in `references/ARCHITECTURE.md` under **Request flows → Login**.

---

## The five phases

### 1. Registration

**Endpoint:** `POST /api/auth/register` (public — in `SecurityConfig.permitAll`)

**Backend chain:**
- `AuthController.register()` receives a `RegisterRequestDto`, calls `AuthMapper.toEntity()` to produce a `User` entity, then passes it to `AuthService.register()`.
- `AuthService.register()` checks for a duplicate email (throws `DuplicateResourceException` → 409 if found), BCrypt-encodes the password via `PasswordEncoder`, forces the role to `CUSTOMER` (callers cannot self-assign `ADMIN`), and calls `UserRepository.save()`.
- No token is issued. The controller returns `201 Created` with an empty body.

**Frontend chain (`AuthService.register()`):**
- Calls `POST /auth/register` with the form payload plus a hardcoded `roles: ['user']` field (ignored by the backend, which always assigns `CUSTOMER`).
- On success, navigates to `/auth/login`. No token stored.

---

### 2. Login

**Endpoint:** `POST /api/auth/login` (public)

**Backend chain:**
```
POST /auth/login (email, password)
  → AuthController.login()
  → AuthService.login(email, password)
      → AuthenticationManager.authenticate(UsernamePasswordAuthenticationToken)
          → DaoAuthenticationProvider
              → UserDetailsServiceImpl.loadUserByUsername(email)
                  → UserRepository.findByEmail(email) → User entity
                  → builds Spring Security UserDetails with ROLE_{role} authority
              → BCryptPasswordEncoder.matches(rawPassword, hashedPassword)
      → JwtService.generateToken(userDetails)
          → HMAC-SHA key from JwtProperties.secret (Base64-decoded env var)
          → subject = email, expiry = JwtProperties.expiration (24h)
  ← AuthResponseDto { access_token: "<jwt>" }
```

**Frontend chain (`AuthService.login()`):**
- Calls `POST /auth/login`, gets back `{ access_token }`.
- Calls `persistToken()`: sets the `token` signal and writes to `localStorage` under key `access_token`.
- Immediately chains `fetchCurrentUser()` (`GET /auth/profile`) to populate the `user` signal and set `profileLoaded = true`.
- Components that read `isAuthenticated` (a `computed` signal) immediately see `true`.

---

### 3. Token persistence and app restart

**`app.config.ts` app initializer:**
```
provideAppInitializer(() => {
    authService.loadProfileIfNeeded().pipe(take(1)).subscribe();
})
```

On every page load/refresh:
- `AuthService` constructor reads `localStorage.getItem('access_token')` into the `token` signal synchronously.
- The app initializer calls `loadProfileIfNeeded()`, which — if a token exists and the profile has not been loaded yet — fires `GET /auth/profile` to re-hydrate the `user` signal.
- If the token is expired, `JwtAuthFilter` will let the request through but set no authentication, Spring Security will reject the `/auth/profile` call with 401, and the Angular `HttpClient` error propagates (the app stays on the login screen with no profile loaded).

---

### 4. Attaching the token to every subsequent request

**`authTokenInterceptor`** (`features/auth/interceptors/auth-token.interceptor.ts`):
- Registered globally in `app.config.ts` via `withInterceptors([authTokenInterceptor, ...])`.
- Reads `AuthService.getToken()` (the signal value) on every outgoing request.
- If a token exists, clones the request and adds `Authorization: Bearer <token>`.
- Services never add this header manually — that is an architectural rule enforced by the interceptor.

---

### 5. Per-request validation on the backend

**`JwtAuthFilter`** (`security/JwtAuthFilter.java`, extends `OncePerRequestFilter`):
- Runs before `UsernamePasswordAuthenticationFilter` on every request.
- Reads the `Authorization` header. If absent or not `Bearer ...`, passes through unauthenticated.
- Extracts the token, calls `JwtService.extractUsername(token)` (reads the `sub` claim via JJWT parser).
- If username is non-null and no auth is in `SecurityContext`: loads `UserDetails` from `UserDetailsServiceImpl`, calls `JwtService.isTokenValid(token, userDetails)` (checks username match + expiry), and sets a `UsernamePasswordAuthenticationToken` into `SecurityContextHolder`.
- A caught `JwtException` results in the request proceeding unauthenticated (Spring Security rejects it downstream if the route requires auth).

**`SecurityConfig`** governs what happens next:
- `SessionCreationPolicy.STATELESS` — no server-side session, ever.
- `permitAll` list: `/auth/register`, `/auth/login`, Swagger endpoints, `GET /products/**`, `GET /suppliers`.
- Everything else: `.anyRequest().authenticated()`.
- Method-level: `@PreAuthorize("hasRole('ADMIN')")` on write operations in `ProductController` and `ProductCategoryController`. This is checked after the filter chain sets `SecurityContext`.

---

## Frontend route protection

Three guards, all in `features/auth/guards/`:

| Guard | Check | Redirect on failure |
|---|---|---|
| `authGuard` | `authService.isAuthenticated()` (signal) | `/auth/login` |
| `guestGuard` | `!authService.isAuthenticated()` | `/products/overview` |
| `rolesGuard` | `authService.hasRole(route.data.roles)` (calls `loadProfileIfNeeded()` first) | `/products/overview` |

Route tree:
- `/auth/**` is behind `guestGuard` — authenticated users are bounced out.
- `/` (root layout) is behind `authGuard` — unauthenticated users are bounced to login.
- `/products/create`, `/products/:id/edit` are additionally behind `rolesGuard` with `roles: ['ADMIN']`.

**UI-level role visibility** uses `HasRoleDirective` (`appHasRole`): it calls `loadProfileIfNeeded()`, then creates or clears the embedded view based on `authService.hasRole(requiredRole)`. Admin-only buttons (e.g., "Create product") are hidden for customers at the template level without any logic in the component class.

---

## Logout

`AuthService.logout()`:
1. Calls `clearToken()` — sets the signal to `null`, removes `access_token` from `localStorage`.
2. Sets `user` signal to `null`, `profileLoaded` to `false`.
3. Navigates to `/auth/login`.

No server-side call — the token is stateless and expires naturally after 24h. The app is fully cleaned up locally.

---

## Key files (exact paths)

**Backend:**
- `onlineshopapi/src/main/java/msg/onlineshopapi/controller/AuthController.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/service/AuthService.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/security/JwtAuthFilter.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/security/JwtService.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/security/JwtProperties.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/security/SecurityConfig.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/security/UserDetailsServiceImpl.java`

**Frontend:**
- `onlineshopui/src/app/features/auth/services/auth.service.ts`
- `onlineshopui/src/app/features/auth/interceptors/auth-token.interceptor.ts`
- `onlineshopui/src/app/features/auth/guards/auth.guard.ts`
- `onlineshopui/src/app/features/auth/guards/guest.guard.ts`
- `onlineshopui/src/app/features/auth/guards/roles.guard.ts`
- `onlineshopui/src/app/features/auth/directives/has-role.directive.ts`
- `onlineshopui/src/app/app.config.ts`

---

## Summary diagram

```
[Register]
  POST /auth/register → AuthController → AuthService (BCrypt + force CUSTOMER role) → UserRepository

[Login]
  POST /auth/login → AuthController → AuthService → AuthenticationManager
    → DaoAuthenticationProvider → UserDetailsServiceImpl → UserRepository
    → BCryptPasswordEncoder.matches()
    → JwtService.generateToken() (HMAC-SHA, 24h)
  ← { access_token }
  Frontend: persistToken() → localStorage + signal; fetchCurrentUser() → user signal

[Every subsequent request]
  authTokenInterceptor: adds Authorization: Bearer <token>
  JwtAuthFilter: extracts token → JwtService.extractUsername() → UserDetailsService.loadByEmail()
    → JwtService.isTokenValid() → SecurityContextHolder.setAuthentication()
  SecurityConfig: session = STATELESS, public endpoints = permitAll, rest = authenticated
  @PreAuthorize("hasRole('ADMIN')"): method-level on write endpoints

[Route protection]
  authGuard (signal check) | guestGuard (inverse) | rolesGuard (profile load + hasRole)
  HasRoleDirective: template-level visibility for role-gated UI elements

[Logout]
  clearToken() → signal null + localStorage.remove → navigate /auth/login
```
