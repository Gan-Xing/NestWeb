# NestWeb

NestWeb is the NestJS backend for the TS full-stack enterprise admin system.
It is paired with `Antdpro6` for the frontend.

Last updated: 2026-06-09

## Enterprise Handoff

Current source of truth:

- [Handoff index and naming rules](docs/handoff/README.md)
- [Single-enterprise handoff v2](docs/handoff/ts-fullstack-single-enterprise-handoff-v2.md)
- [S8 message approval export handoff](docs/handoff/ts-fullstack-s8-message-approval-export-handoff.md)
- [S9 delivery handoff](docs/handoff/ts-fullstack-s9-delivery-handoff.md)

Historical references:

- [TS full-stack enterprise handoff](docs/handoff/ts-fullstack-enterprise-handoff.md)
- [Single-enterprise handoff and prompts](docs/handoff/single-enterprise-handoff-and-prompts.md)

Use the v2 handoff plus the S8 and S9 handoffs as the source of truth for
current staged work. S0, S1, S2, S3, S5, S7, and S8 are complete. S9 packages
the system for demo, delivery, and secondary development. S4 knowledge base and
S6 AI assistant remain paused.

## Enterprise Docs

- [Deployment guide](docs/deployment.md)
- [Environment variables](docs/env-vars.md)
- [Page inventory](docs/pages.md)
- [Permission code inventory](docs/permissions.md)
- [Permission model](docs/permission-model.md)
- [Security baseline](docs/security-baseline.md)
- [Internationalization](docs/i18n.md)
- [Operations runbook](docs/ops-runbook.md)
- [Release checklist](docs/release-checklist.md)
- [Rollback guide](docs/rollback.md)
- [OpenAPI contract](docs/openapi/nestweb.openapi.json)
- [Business module guide](docs/development/business-module-guide.md)
- [Message center integration](docs/development/message-center-integration.md)
- [Approval Lite integration](docs/development/approval-lite-integration.md)
- [Table export guide](docs/development/table-export-guide.md)
- [OpenAPI workflow](docs/development/openapi-workflow.md)
- [E2E guide](docs/development/e2e-guide.md)
- [Demo script](docs/demo/demo-script.md)

## Common Commands

```bash
pnpm install
pnpm run lint:check
pnpm test
pnpm run build
pnpm run db:migrate:deploy
pnpm run db:seed
pnpm run db:seed:demo # optional demo data, never part of production startup
pnpm run i18n:check
pnpm run openapi:generate
pnpm run openapi:check
```

## OpenAPI Contract

Generate the frontend contract from source, not from a running production API:

```bash
pnpm run openapi:generate
```

The generated contract is written to `docs/openapi/nestweb.openapi.json`.
Antdpro6 reads this file by default when regenerating `src/services/nest-web`,
which avoids accidentally connecting to an old backend schema.

CI runs `pnpm run openapi:check` to regenerate the contract and fail if
`docs/openapi/nestweb.openapi.json` has uncommitted drift.

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
- Do not add S4 knowledge base, S6 AI, Department, Position, import, BPMN, or concrete business pages during S9 delivery packaging.
- Approval Lite is a single-step approval helper, not a full workflow engine.
- Table export is current-page CSV export unless a later task explicitly adds backend async export.
- Keep each staged change small and independently verifiable.
