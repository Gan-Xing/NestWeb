# NestWeb Deployment Guide

This guide covers the backend API deployment flow for the single-tenant
enterprise admin baseline.

## Runtime Requirements

- Node.js `24.x`
- pnpm `9.15.4`
- PostgreSQL with the Prisma schema applied
- Redis for cache, captcha, token helpers, and queue support
- RabbitMQ for email queues
- MinIO or an S3-compatible object store for uploaded assets

## Local Docker Deployment

1. Create an environment file:

```bash
cp .env.example .env
```

2. Replace all placeholder secrets in `.env`.

Required production-like values:

- `DATABASE_URL`
- `POSTGRES_PASSWORD`
- `RABBITMQ_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MINIO_SECRET_KEY`
- `CORS_ORIGINS`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

3. Build and start the stack:

```bash
docker compose up -d --build
```

Docker Compose starts a one-shot `migrate` service before the API container.
The API container does not run Prisma migrations during process startup.

4. Verify readiness:

```bash
docker compose ps api migrate
curl http://localhost:3030/api/health/live
curl http://localhost:3030/api/health/ready
```

## Non-Docker Deployment

1. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

2. Build the application:

```bash
pnpm run build
```

3. Run migrations exactly once before starting or replacing API instances:

```bash
pnpm run db:migrate:deploy
```

4. Start the API:

```bash
pnpm run start:prod
```

Do not run `prisma migrate deploy` from every API process in a multi-replica
deployment. Run it as a deployment job, then start or roll the API replicas.

## Seed Data

Run seed only when bootstrapping a new environment or intentionally refreshing
system-managed roles, menus, and permissions:

```bash
pnpm run db:seed
```

The seed creates or updates:

- `Role.code = "admin"` as the system administrator role
- `Role.code = "user"` as the default user role
- System-managed menus and permission codes
- The initial administrator account

Production seed requires `ADMIN_EMAIL`, `ADMIN_USERNAME`, and a strong
`ADMIN_PASSWORD`. Running seed updates the bootstrap administrator password to
`ADMIN_PASSWORD`; do not use `admin123` or any placeholder value outside local
development.

## Health Endpoints

- `GET /api/health`: backward-compatible liveness payload
- `GET /api/health/live`: process liveness only
- `GET /api/health/ready`: readiness check for database and Redis

Use `/api/health/live` for restart probes and `/api/health/ready` for traffic
readiness or Docker health checks.

RabbitMQ and MinIO are runtime integrations but are not yet part of the
readiness gate. S1 keeps the probe low-cost and documents the gap; add explicit
RabbitMQ and MinIO checks before queue/storage outages must block traffic.

## OpenAPI

Swagger/OpenAPI is disabled by default in production. Enable it only for trusted
environments:

```bash
SWAGGER_ENABLED=true
```

If OpenAPI output changes, regenerate the Antdpro6 client with:

```bash
pnpm run openapi:nest
```

from the `Antdpro6` repository.
