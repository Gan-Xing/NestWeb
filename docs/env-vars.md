# NestWeb Environment Variables

Use `.env.example` as the template. `.env` is ignored by git and must not be
committed.

## Required

| Variable | Purpose | Production rule |
| --- | --- | --- |
| `DATABASE_URL` | Prisma PostgreSQL connection string | Required |
| `POSTGRES_DB` | Local Docker database name | Required for Compose |
| `POSTGRES_USER` | Local Docker database user | Required for Compose |
| `POSTGRES_PASSWORD` | Local Docker database password | Use a strong secret |
| `JWT_ACCESS_SECRET` | Access token signing secret | Required, at least 32 chars, not a placeholder |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Required, at least 32 chars, not a placeholder |
| `CORS_ORIGINS` | Allowed frontend origins | Required in production unless `CORS_ENABLED=false` |
| `ADMIN_EMAIL` | Bootstrap administrator email for seed | Required when running seed in production |
| `ADMIN_USERNAME` | Bootstrap administrator username for seed | Required when running seed in production |
| `ADMIN_PASSWORD` | Bootstrap administrator password for seed | Required, at least 10 chars, strong, and not a default value in production |

## Infrastructure

| Variable | Purpose | Default notes |
| --- | --- | --- |
| `REDIS_CLIENTS` | Comma-separated Redis client names | Usually `default` |
| `REDIS_HOST_DEFAULT` | Default Redis host | `redis` in Compose |
| `REDIS_PORT_DEFAULT` | Default Redis port | `6379` |
| `REDIS_PASSWORD_DEFAULT` | Default Redis password | Empty when Redis has no password |
| `REDIS_DB_DEFAULT` | Default Redis DB index | `0` |
| `RABBITMQ_URI` | RabbitMQ connection URL | Must match RabbitMQ credentials |
| `RABBITMQ_USER` | RabbitMQ username | Required in Compose |
| `RABBITMQ_PASSWORD` | RabbitMQ password | Use a strong secret |

## Object Storage

| Variable | Purpose |
| --- | --- |
| `MINIO_ENDPOINT` | Public storage endpoint or host |
| `MINIO_PUBLIC_URL` | Public base URL for generated asset URLs |
| `MINIO_INTERNAL_ENDPOINT` | Internal Docker network endpoint |
| `MINIO_INTERNAL_PORT` | Internal storage port |
| `MINIO_INTERNAL_USE_SSL` | Internal storage SSL flag |
| `MINIO_ACCESS_KEY` | Storage access key |
| `MINIO_SECRET_KEY` | Storage secret key |
| `MINIO_DEFAULT_BUCKET` | Default bucket |
| `OSS_CDN_URL` | Optional CDN/public asset prefix |

## Security And Runtime

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `production` in Docker |
| `CORS_ENABLED` | Set `false` to disable CORS entirely | Enabled unless explicitly false |
| `SWAGGER_ENABLED` | Enable Swagger/OpenAPI UI | `false` in production |
| `METRICS_PUBLIC` | Make `/metrics` public | `false` |
| `METRICS_BEARER_TOKEN` | Optional bearer token for `/metrics` | Empty |
| `RATE_LIMIT_WINDOW_MS` | Global rate limit window | `60000` |
| `RATE_LIMIT_MAX` | Global request limit | `120` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Auth endpoint rate limit window | `60000` |
| `AUTH_RATE_LIMIT_MAX` | Auth endpoint request limit | `10` |

## Optional Integrations

| Variable | Purpose |
| --- | --- |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USER` | SMTP user |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_FROM` | Sender address |
| `GMAIL_USER` | Gmail integration user |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `ALIBABA_CLOUD_ACCESS_KEY_ID` | Alibaba Cloud key ID |
| `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | Alibaba Cloud key secret |
| `MINIPROGRAM_APPID` | WeChat mini-program app ID |
| `MINIPROGRAM_SECRET` | WeChat mini-program secret |
| `SMS_DRY_RUN` | Disable real SMS sending when `true` |

## Validation Behavior

`validateRuntimeConfig()` rejects production startup when:

- `DATABASE_URL` is missing
- JWT secrets are missing, too short, or known placeholders
- CORS is enabled but `CORS_ORIGINS` is empty

This is intentional. Fix environment configuration instead of weakening the
runtime checks.

## Seed Administrator

`prisma/seed.ts` reads:

- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Outside production, local defaults are still available for developer
bootstrapping. In production, all three values are required and
`ADMIN_PASSWORD` must not be a default or weak value.

The seed treats the bootstrap administrator as seed-managed. Running
`pnpm run db:seed` updates that user's password to `ADMIN_PASSWORD` and connects
the `admin` role. Use seed deliberately and rotate the password through the same
environment-controlled process.
