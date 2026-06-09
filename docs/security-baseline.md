# Security Baseline

This document describes the current production safety defaults for NestWeb.

Last updated: 2026-06-09

## Runtime Configuration

Production startup validates:

- `DATABASE_URL` is present
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strong non-placeholder values
- `CORS_ORIGINS` is explicit unless CORS is disabled

The API should fail fast when these values are unsafe.

## HTTP Security

Current defaults:

- `helmet` is enabled
- `x-powered-by` is disabled
- CORS is restricted by `CORS_ORIGINS` in production
- Swagger/OpenAPI is disabled in production unless explicitly enabled
- `/metrics` is private by default and can be protected with a bearer token

## Rate Limiting

The global throttler is enabled through `@nestjs/throttler`.

Auth endpoints use stricter limits:

- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX`

Tune these values for the deployment size and expected login traffic.

## Tokens And Sessions

Current behavior:

- Access tokens and refresh tokens are signed separately.
- Access tokens are returned to the frontend and kept in client storage.
- Refresh tokens are not returned in JSON responses; they are stored in an
  `HttpOnly` cookie named `nestweb_refresh_token`.
- The refresh cookie uses `HttpOnly`, `SameSite=Lax`, `/api/auth` path scope,
  and `Secure` in production by default. Override
  `REFRESH_TOKEN_COOKIE_SECURE=false` only for local HTTP demos.
- Refresh token hashes are stored server-side in `User.hashedRt`.
- Every successful refresh rotates the refresh JWT and replaces the stored hash.
- Refresh-token reuse is detected when a valid refresh JWT no longer matches
  the stored hash. The server clears the stored refresh hash and rejects the
  request.
- Logout clears the refresh cookie and revokes the current stored refresh hash
  when the cookie matches the active session.

Known remaining hardening item:

- Current storage is single-session per account because `User.hashedRt` stores
  one active refresh hash. If the product needs multiple concurrent devices,
  add a `RefreshSession` table with device/session IDs, revocation timestamps,
  and incident telemetry.

## Logging

Logging and system-log interceptors redact sensitive values from URLs and
payloads. Do not log:

- passwords
- raw tokens
- authorization headers
- verification codes
- provider secrets

If new modules add logs, reuse the existing sensitive-data utilities.

## Health And Metrics

Health endpoints:

- `/api/health/live`: process liveness
- `/api/health/ready`: database and Redis readiness
- `/api/system/status`: authenticated database, Redis, RabbitMQ, MinIO, and queue diagnostics

Use readiness for load balancer traffic decisions.

RabbitMQ and MinIO stay out of the unauthenticated readiness gate. Diagnose them
through authenticated operations endpoints instead of blocking traffic startup.

Metrics:

- Keep `METRICS_PUBLIC=false` unless the endpoint is behind a trusted network.
- Prefer `METRICS_BEARER_TOKEN` when Prometheus is outside the private network.

## Deployment Safety

Prisma migrations are not executed by the API process. Run migrations as a
separate deployment step before rolling API instances.

This avoids multiple replicas applying migrations concurrently.

## Administrator Account

The seed account is for bootstrap only. Before public exposure:

- configure `ADMIN_EMAIL`, `ADMIN_USERNAME`, and a strong `ADMIN_PASSWORD`
- consider disabling password login if SSO is added later
- keep admin role protection based on `Role.code = "admin"`

Production seed refuses missing admin credentials and rejects default or weak
admin passwords. Running seed updates the bootstrap administrator password to
the configured `ADMIN_PASSWORD`.
