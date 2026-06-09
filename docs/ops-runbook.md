# 运维排障手册

更新时间：2026-06-09

## 核心探针

| 接口                      | 用途                                                      | 是否鉴权 |
| ------------------------- | --------------------------------------------------------- | -------- |
| `GET /api/health`         | 兼容旧健康检查                                            | 否       |
| `GET /api/health/live`    | 进程存活                                                  | 否       |
| `GET /api/health/ready`   | 数据库和 Redis 就绪                                       | 否       |
| `GET /api/system/status`  | DB / Redis / RabbitMQ / MinIO / Queue 聚合状态            | 是       |
| `GET /api/system/version` | 版本、环境、Node、commit、build time                      | 是       |
| `GET /api/system/queues`  | Bull 队列 waiting / active / completed / failed / delayed | 是       |

## 常用检查

```bash
docker compose ps
docker compose logs -f api
curl http://localhost:3030/api/health/live
curl http://localhost:3030/api/health/ready
```

前端：

```bash
curl -I http://localhost:8000/user/login
curl -I http://localhost:8000/dashboard
```

## 常见问题

### 登录失败

1. 检查 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 是否按当前环境 seed。
2. 检查用户是否被禁用。
3. 检查 `JWT_ACCESS_SECRET` 和 `JWT_REFRESH_SECRET` 是否与当前服务一致。
4. 查看 `/security/login-logs` 的失败原因。

### 菜单缺失

1. 确认已经运行 `pnpm run db:seed`。
2. 确认角色绑定了对应权限码。
3. 确认前端用户已重新登录，避免旧 initialState 缓存。
4. 查看 `/api/menus/user` 返回的当前用户菜单。

### `/api/system/status` 异常

1. `database` 异常：检查 `DATABASE_URL`、PostgreSQL 容器和 migration。
2. `redis` 异常：检查 `REDIS_HOST_DEFAULT`、密码和 DB index。
3. `rabbitmq` 异常：检查 `RABBITMQ_URI`、用户名、密码和容器状态。
4. `minio` 异常：检查 MinIO endpoint、access key、secret key 和 bucket。
5. `queue` 异常：检查 Bull Redis 连接和队列 worker 日志。

### OpenAPI 或前端 service 不一致

1. 在 NestWeb 从源码重新生成固定契约：

```bash
pnpm run openapi:generate
pnpm run openapi:check
```

2. 在 Antdpro6 重新生成前端客户端：

```bash
pnpm run openapi:nest
pnpm run openapi:nest:check
pnpm run tsc
```

不要默认从运行环境 `/openapi.json` 拉 schema，避免连接旧服务后覆盖新接口。

## 回滚原则

- 数据库 migration 使用 `prisma migrate deploy`，不要手工改线上结构。
- 前端静态资源回滚到上一版镜像或上一版 `dist`。
- 后端回滚到上一版镜像后，确认 migration 是否兼容。
- 若 seed 导致权限异常，先恢复角色权限关联，再重新运行受控 seed。
