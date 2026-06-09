# 发布检查清单

用于单企业通用后台基础版发布前验收。

更新时间：2026-06-09

## 代码状态

- [ ] NestWeb 工作区干净或只包含本次发布改动。
- [ ] Antdpro6 工作区干净或只包含本次发布改动。
- [ ] 本次不包含 S4 知识库、S6 AI、多租户、部门岗位或 RBAC 大重构。
- [ ] S9 只包含 demo seed、测试、文档、演示闭环和明显交付体验修复。
- [ ] 后端 DTO / Controller 变化后已运行 `pnpm run openapi:check`。
- [ ] 前端 generated client 已运行 `pnpm run openapi:nest:check`。

## 后端验收

```bash
pnpm run openapi:check
pnpm run i18n:check
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
- [ ] 消息中心接口限制普通用户只能查看自己的消息。
- [ ] Approval Lite 创建、通过、驳回、取消会同步待办/通知。
- [ ] `pnpm run db:seed:demo` 在演示环境可重复执行，且不进入生产自动启动流程。

## 前端验收

```bash
pnpm run openapi:nest:check
pnpm run i18n:check
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
- [ ] `/message-center` 的待办、通知、已处理 tab 正常加载。
- [ ] 消息中心支持标记已读、全部已读、完成待办。
- [ ] `/approvals/requests` 可新建审批、查看待我审批、通过审批并更新状态。
- [ ] 用户、角色、权限、菜单、字典、系统参数、文件、操作日志、登录日志、消息中心、审批请求都有当前页导出入口。
- [ ] 空数据表格点击当前页导出会给出明确提示，不下载空文件。
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

## 演示检查

- [ ] 如需演示数据，先运行 `pnpm run db:seed`，再运行 `pnpm run db:seed:demo`。
- [ ] 已确认 demo 用户密码 `Demo1234.` 仅用于演示或验收环境。
- [ ] 已按 `docs/demo/demo-script.md` 跑通：登录、消息中心、Approval Lite、文件中心、系统状态、当前页导出。

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
- [ ] 消息中心待办、通知、已处理。
- [ ] 审批请求新建和通过。
- [ ] 当前页 CSV 导出。
- [ ] 系统状态。
- [ ] 退出登录。
