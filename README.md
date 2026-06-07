# NestWeb

NestWeb is the NestJS backend for the TS full-stack enterprise admin system.
It is paired with `Antdpro6` for the frontend.

## Enterprise Handoff

The current enterprise modernization plan is saved here:

- [TS full-stack enterprise handoff](docs/handoff/ts-fullstack-enterprise-handoff.md)

Use this handoff document as the source of truth for future staged work. It
records the agreed sequence for `Role.code`, frontend productization,
Dashboard summary, Playwright E2E, and later security baseline work.

## Common Commands

```bash
pnpm install
pnpm run lint:check
pnpm test
pnpm run build
```

## Local Docker

```bash
docker compose up -d --build
```

The API listens on `http://localhost:3030`.

Health check:

```bash
curl http://localhost:3030/api/health
```

## Notes For Future Work

- Keep backend API changes aligned with `Antdpro6` OpenAPI generation.
- For permission model work, system identity should use `code`, not `name`.
- Do not add multi-tenant or data-permission scope unless the task explicitly asks for it.
- Keep each staged change small and independently verifiable.
