# Rollback Guide

Use this guide when a deployment causes runtime failures, broken login, or
database/API incompatibility.

Last updated: 2026-06-09

## Before Rollback

Capture current state:

```bash
docker compose ps
docker logs nestweb-api --tail=200
docker logs nestweb-migrate --tail=200
curl http://localhost:3030/api/health/ready
```

If the failure is database-related, take a backup before attempting manual
repair.

## Application Rollback

For Docker Compose deployments:

1. Check out the previous known-good commit or image tag.
2. Rebuild and restart the API:

```bash
docker compose up -d --build api
```

3. Verify readiness:

```bash
curl http://localhost:3030/api/health/ready
```

For non-Docker deployments:

```bash
git checkout <previous-good-commit>
pnpm install --frozen-lockfile
pnpm run build
pnpm run start:prod
```

## Migration Rollback

Prisma migrations are forward-only in normal operation. Do not assume a failed
deployment can be fixed by simply checking out older code.

Preferred order:

1. If the migration was not applied, roll back application code only.
2. If the migration was applied but is backward compatible, roll back
   application code and keep the schema.
3. If the migration is destructive or incompatible, restore the database from a
   backup or apply a reviewed corrective migration.

Never run ad-hoc SQL against production without saving the SQL and expected
effect in the incident notes.

## Seed Rollback

`pnpm run db:seed` updates system-managed roles, menus, and permissions. If a
seed causes unexpected menu or permission changes:

1. Check `prisma/seed.ts` and `src/common/rbac/system-managed.ts`.
2. Fix the seed source.
3. Re-run seed in a controlled environment.
4. Only then apply to production.

## Frontend Compatibility

When rolling back the backend, make sure the Antdpro6 OpenAPI-generated client
is compatible with the backend version. If not, roll back both repos to the last
paired commits.

Record paired commits in release notes before production rollout.
