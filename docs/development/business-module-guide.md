# Business Module Guide

更新时间：2026-06-09

本文说明如何在当前单企业通用后台中新增一个业务模块。S9 阶段只沉淀接入规范，不新增具体业务页面。

## 边界

- 不新增 Tenant / UserTenant。
- 不新增 Department / Position，除非后续真的需要组织树、部门数据隔离或部门审批。
- 不把 Approval Lite 改造成流程引擎。
- 不把当前页 CSV 导出改造成后端异步全量导出。

## 后端接入步骤

1. 在 `prisma/schema.prisma` 增加业务模型。
2. 生成 migration，禁止手写线上结构变更。
3. 增加 DTO、Entity、Service、Controller。
4. Controller 使用 `/api/<module>` 路径。
5. Controller 使用 `@Permissions('<module>.<action>')` 绑定权限码。
6. Service 内只处理业务规则，不绕过 RBAC guard。
7. 如需消息或审批，使用 `businessType + businessId` 关联业务记录。
8. 在 `prisma/seed.ts` 增加菜单和权限码。
9. 运行 `pnpm run openapi:generate` 和 `pnpm run openapi:check`。
10. 增加 service/controller 测试。

## 前端接入步骤

1. 在 Antdpro6 增加路由页面。
2. 运行 `pnpm run openapi:nest` 生成 client。
3. 在 `src/access.ts` 增加权限判断。
4. 页面使用后端生成的 service，不手写重复 API client。
5. 列表页优先使用 `ProTable`。
6. 如需要导出，接入 `TableExportButton` 做当前页 CSV。
7. 页面文案必须加入 `zh-CN` 和 `en-US` locale。
8. 增加必要 E2E 覆盖。

## 必须同步的文档

- `docs/pages.md`
- `docs/permissions.md`
- `docs/development/message-center-integration.md`，如果接入消息中心
- `docs/development/approval-lite-integration.md`，如果接入 Approval Lite
- `docs/development/table-export-guide.md`，如果接入当前页导出

## 最小验收

NestWeb：

```bash
pnpm run lint:check
pnpm test -- --runInBand
pnpm run build
pnpm run openapi:check
```

Antdpro6：

```bash
pnpm run tsc
pnpm test -- --runInBand
pnpm run build
pnpm run openapi:nest:check
pnpm run e2e
```
