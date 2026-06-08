# 发布检查清单

用于单企业通用后台基础版发布前验收。

## 代码状态

- [ ] NestWeb 工作区干净或只包含本次发布改动。
- [ ] Antdpro6 工作区干净或只包含本次发布改动。
- [ ] 本次不包含 S4 知识库、S6 AI、多租户、部门岗位或 RBAC 大重构。
- [ ] 后端 DTO / Controller 变化后已确认是否需要重新生成 OpenAPI。

## 后端验收

```bash
pnpm run lint:check
pnpm test -- --runInBand
pnpm run build
pnpm run db:migrate:deploy
pnpm run db:seed
```

检查：

- [ ] `/api/health/live` 正常。
- [ ] `/api/health/ready` 正常。
- [ ] `/api/system/status` 返回 DB / Redis / RabbitMQ / MinIO / Queue 状态。
- [ ] `/api/system/version` 返回版本和构建信息。
- [ ] `/api/system/queues` 返回队列统计。
- [ ] `/api/security/login-logs` 可分页查询。
- [ ] `/api/system-log/:id` 可查看操作日志详情。

## 前端验收

```bash
pnpm run tsc
pnpm test -- --runInBand
pnpm run build
pnpm run e2e
```

检查：

- [ ] 登录成功进入 `/dashboard`。
- [ ] 登录失败停留在登录页。
- [ ] 刷新页面保持登录。
- [ ] Access token 过期后可自动 refresh。
- [ ] 退出登录后访问受保护页面跳回 `/user/login`。
- [ ] `/system/status`、`/system/version`、`/system/queues`、`/security/login-logs` 正常加载。
- [ ] 无权限菜单不可见，直接访问受限页面展示 403。
- [ ] 404 / 403 / 500 页面文案为产品化文案。
- [ ] SettingDrawer 和 OpenAPI 链接仅开发环境展示。

## 部署检查

- [ ] `.env` 不包含占位符或弱密钥。
- [ ] `CORS_ORIGINS` 只允许真实前端域名。
- [ ] `SWAGGER_ENABLED=false`，除非是可信测试环境。
- [ ] `METRICS_PUBLIC=false` 或配置 `METRICS_BEARER_TOKEN`。
- [ ] MinIO bucket 已存在或服务可自动创建。
- [ ] RabbitMQ / Redis / PostgreSQL 容器健康。
- [ ] 前端 Nginx 安全响应头已启用。

## 发布后冒烟

```bash
curl -I http://localhost:8000/user/login
curl http://localhost:3030/api/health/ready
```

浏览器检查：

- [ ] 登录。
- [ ] 工作台。
- [ ] 用户管理。
- [ ] 角色管理。
- [ ] 系统日志详情。
- [ ] 登录日志。
- [ ] 系统状态。
- [ ] 退出登录。
