# How Auth Works End-to-End in This App

## Overview

The app uses **JWT (JSON Web Token)** based stateless authentication. The backend is Spring Boot, the frontend is Angular. Here is the complete flow from registration through protected route access.

---

## 1. Registration

**Frontend:**
- The user fills in a register form (`RegisterPageComponent`) with `firstName`, `lastName`, `email`, `password`.
- The component calls `AuthService.register()`, which POSTs to `/auth/register`.
- On success, the user is redirected to the login page.

**Backend:**
- `POST /auth/register` is a public endpoint (no JWT required — listed in `SecurityConfig` as `permitAll()`).
- `AuthController.register()` receives a `RegisterRequestDto`, maps it to a `User` entity via `AuthMapper`.
- `AuthService.register()` checks for duplicate email, BCrypt-encodes the password, sets the role to `CUSTOMER` (hardcoded — users can only self-register as customers), and saves the user.

---

## 2. Login

**Frontend:**
- The user fills in `LoginPageComponent` with `email` and `password`.
- `AuthService.login()` POSTs `{ email, password }` to `/auth/login`.
- On success, the JWT `access_token` is stored in `localStorage` (key: `access_token`) via `persistToken()`.
- Immediately after storing the token, `fetchCurrentUser()` is called which GETs `/auth/profile` to populate the `user` signal with the full user profile (including role).
- The user is then navigated to the products overview.

**Backend:**
- `POST /auth/login` is a public endpoint (`permitAll()`).
- `AuthController.login()` calls `AuthService.login(email, password)`.
- `AuthService.login()` calls `authenticationManager.authenticate()` with a `UsernamePasswordAuthenticationToken` — this triggers Spring Security's `DaoAuthenticationProvider`, which calls `UserDetailsServiceImpl.loadUserByUsername(email)` to look up the user and BCrypt-verify the password.
- If credentials are valid, `JwtService.generateToken()` creates a signed JWT with the email as subject, issued-at timestamp, and expiration.
- The response is `{ "access_token": "<jwt>" }`.

---

## 3. Token Structure

The JWT is an HMAC-SHA signed token using a secret key configured in `app.jwt.secret` (`JwtProperties`). It contains:
- **subject**: the user's email address
- **issuedAt**: timestamp of generation
- **expiration**: `issuedAt + app.jwt.expiration` (milliseconds)

No roles are embedded in the token itself — role lookup on the backend always goes to the database via `UserDetailsServiceImpl`.

---

## 4. Authenticated Requests (Interceptor)

**Frontend:**
- `authTokenInterceptor` (registered as an `HttpInterceptorFn` in `app.config.ts`) runs on every HTTP request.
- If a token exists in `AuthService`, it clones the request and adds the `Authorization: Bearer <token>` header.

**Backend:**
- `JwtAuthFilter` (a `OncePerRequestFilter`) intercepts every request.
- It reads the `Authorization` header, strips the `Bearer ` prefix, and calls `JwtService.extractUsername(token)` to get the email.
- If the email is non-null and there is no existing authentication in the `SecurityContextHolder`, it loads `UserDetails` from the database, validates the token (username match + not expired), and sets a `UsernamePasswordAuthenticationToken` in the security context.
- Invalid or missing tokens are silently ignored — the filter chain continues unauthenticated, and Spring Security will reject the request at the authorization layer if the endpoint requires authentication.

---

## 5. Role-Based Authorization

**Backend:**
- `SecurityConfig` enables `@EnableMethodSecurity`, so controllers can use `@PreAuthorize`.
- Admin-only operations (create/update/delete products and categories) are annotated with `@PreAuthorize("hasRole('ADMIN')")`.
- `UserDetailsServiceImpl` maps the `UserRole` enum to a Spring granted authority as `ROLE_<role>` (e.g., `ROLE_ADMIN`, `ROLE_CUSTOMER`).

**Frontend:**
- `rolesGuard` protects routes that require a specific role. It reads `route.data.roles`, calls `loadProfileIfNeeded()` to ensure the user profile is loaded, then calls `authService.hasRole()`. Unauthorized users are redirected to the products overview.
- `HasRoleDirective` (`*appHasRole="UserRole.ADMIN"`) conditionally renders template content based on the user's role — used to show/hide UI elements like admin-only action buttons.
- `authService.roles` is a computed signal derived from the loaded `user` signal, returning an array with the user's single role.

---

## 6. Route Guards Summary

| Guard | Purpose | Behavior |
|---|---|---|
| `authGuard` | Protects all main app routes | Redirects to `/auth/login` if not authenticated |
| `guestGuard` | Protects login/register routes | Redirects to `/products/overview` if already authenticated |
| `rolesGuard` | Protects role-restricted routes | Redirects to `/products/overview` if role check fails |

The root route layout (everything under `''`) is wrapped with `canActivate: [authGuard]`, so all feature routes (products, cart, orders) require a valid token.

---

## 7. App Startup (Token Persistence)

When the Angular app boots, `app.config.ts` registers a `provideAppInitializer` that calls `authService.loadProfileIfNeeded()`. This:
- Reads any existing token from `localStorage` (populated in `AuthService` constructor via `readTokenFromStorage()`).
- If a token exists, fetches `/auth/profile` to reload the user's profile into the `user` signal.
- This restores auth state across page refreshes without requiring a re-login.

---

## 8. Logout

`AuthService.logout()`:
- Clears the token from the `token` signal and `localStorage`.
- Sets `user` to null and `profileLoaded` to false.
- Navigates to `/auth/login`.

---

## End-to-End Flow Diagram

```
USER                    ANGULAR FRONTEND                    SPRING BOOT BACKEND
 |                            |                                     |
 |-- fill register form ----->|                                     |
 |                            |-- POST /auth/register ------------->|
 |                            |                         validate, hash pw, save user
 |                            |<-- 201 Created -------------------- |
 |                            |-- navigate to /auth/login           |
 |                            |                                     |
 |-- fill login form -------->|                                     |
 |                            |-- POST /auth/login ---------------->|
 |                            |              AuthService.login()    |
 |                            |              authenticate via DaoAuthenticationProvider
 |                            |              JwtService.generateToken()
 |                            |<-- { access_token: "..." } --------|
 |                            |-- persist token to localStorage     |
 |                            |-- GET /auth/profile (+ Bearer hdr)->|
 |                            |              JwtAuthFilter validates token
 |                            |              sets SecurityContext
 |                            |<-- { id, email, role, ... } -------|
 |                            |-- navigate to /products/overview    |
 |                            |                                     |
 |-- navigate to /orders ---->|                                     |
 |                            |-- authGuard checks token            |
 |                            |-- GET /orders (+ Bearer hdr) ------>|
 |                            |              JwtAuthFilter validates
 |                            |              @PreAuthorize checks role (if applicable)
 |                            |<-- orders data --------------------|
```
