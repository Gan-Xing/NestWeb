# NestWeb

NestWeb is the NestJS backend for the TS full-stack enterprise admin system.
It is paired with `Antdpro6` for the frontend.

## Enterprise Handoff

The current enterprise modernization plan is saved here:

- [Single-enterprise handoff v2](docs/handoff/ts-fullstack-single-enterprise-handoff-v2.md)
- [S8 message approval export handoff](docs/handoff/ts-fullstack-s8-message-approval-export-handoff.md)
- [TS full-stack enterprise handoff](docs/handoff/ts-fullstack-enterprise-handoff.md)
- [Single-enterprise handoff and prompts](docs/handoff/single-enterprise-handoff-and-prompts.md)

Use the v2 handoff document as the source of truth for current staged work.
S1, S2, S3, S5, and S7 are the active completed baseline; S4 knowledge base and
S6 AI assistant remain paused.

## Enterprise Docs

- [Deployment guide](docs/deployment.md)
- [Environment variables](docs/env-vars.md)
- [Page inventory](docs/pages.md)
- [Permission code inventory](docs/permissions.md)
- [Permission model](docs/permission-model.md)
- [Security baseline](docs/security-baseline.md)
- [Operations runbook](docs/ops-runbook.md)
- [Release checklist](docs/release-checklist.md)
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

Authenticated operations checks are available at `/api/system/status`,
`/api/system/version`, and `/api/system/queues`. Use `/api/system/status` for
DB, Redis, RabbitMQ, MinIO, and Bull queue diagnostics after login.

## Notes For Future Work

- Keep backend API changes aligned with `Antdpro6` OpenAPI generation.
- For permission model work, system identity should use `code`, not `name`.
- Do not add multi-tenant or data-permission scope unless the task explicitly asks for it.
- Keep each staged change small and independently verifiable.
