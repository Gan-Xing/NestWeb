# Security Baseline

This document describes the current production safety defaults for NestWeb.

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
- Refresh token hashes are stored server-side.
- Refresh rotates the stored refresh token hash.
- Logout clears the stored refresh token hash.

Known remaining hardening item:

- Refresh-token reuse detection is not yet implemented as a separate incident
  signal. Rotation exists, but replay telemetry and forced session invalidation
  policy should be added before high-risk enterprise deployment.

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

Use readiness for load balancer traffic decisions.

RabbitMQ and MinIO are documented readiness TODOs. Keep them out of traffic
gating until cheap, authenticated probes are wired in application startup
context.

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
