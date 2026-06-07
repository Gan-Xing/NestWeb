# NestWeb

NestWeb is the NestJS backend for the TS full-stack enterprise admin system.
It is paired with `Antdpro6` for the frontend.

## Enterprise Handoff

The current enterprise modernization plan is saved here:

- [TS full-stack enterprise handoff](docs/handoff/ts-fullstack-enterprise-handoff.md)

Use this handoff document as the source of truth for future staged work. It
records the agreed sequence for `Role.code`, frontend productization,
Dashboard summary, Playwright E2E, and later security baseline work.

## Enterprise Docs

- [Deployment guide](docs/deployment.md)
- [Environment variables](docs/env-vars.md)
- [Permission model](docs/permission-model.md)
- [Security baseline](docs/security-baseline.md)
- [Rollback guide](docs/rollback.md)

## Common Commands

```bash
pnpm install
pnpm run lint:check
pnpm test
pnpm run build
pnpm run db:migrate:deploy
```

## Local Docker

```bash
docker compose up -d --build
```

The API listens on `http://localhost:3030`.
Docker Compose runs the one-shot `migrate` service before starting the API.
Outside Compose, run `pnpm run db:migrate:deploy` once during deployment before
starting `pnpm run start:prod`.

Health checks:

```bash
curl http://localhost:3030/api/health
curl http://localhost:3030/api/health/live
curl http://localhost:3030/api/health/ready
```

Use `/api/health/live` for process liveness and `/api/health/ready` for
readiness checks that verify database and Redis connectivity. The Docker
Compose API healthcheck uses readiness.

## Notes For Future Work

- Keep backend API changes aligned with `Antdpro6` OpenAPI generation.
- For permission model work, system identity should use `code`, not `name`.
- Do not add multi-tenant or data-permission scope unless the task explicitly asks for it.
- Keep each staged change small and independently verifiable.
