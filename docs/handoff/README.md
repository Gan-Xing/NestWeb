# Handoff 文档索引

更新时间：2026-06-09

## 当前有效文档

- [单企业通用后台 Handoff v2](ts-fullstack-single-enterprise-handoff-v2.md)
- [S8 消息中心 + 审批基础预留 + 表格导出 Handoff](ts-fullstack-s8-message-approval-export-handoff.md)

## 历史参考

- [TS 全栈企业化旧路线](ts-fullstack-enterprise-handoff.md)
- [单企业旧 handoff 与 prompts](single-enterprise-handoff-and-prompts.md)

历史文档只用于理解演进过程。后续开发判断以当前有效文档为准。

## 命名规则

后续新增 handoff 快照文档使用日期前缀：

```text
YYYY-MM-DD-topic.md
```

例如：

```text
2026-06-09-s8-openapi-ci-acceptance.md
```

`deployment.md`、`env-vars.md`、`pages.md`、`permissions.md` 这类稳定入口文档不建议在文件名里频繁改日期，因为 README、CI、脚本和外部引用需要稳定路径。它们应在文件顶部维护 `更新时间`。

## 当前阶段状态

```text
S0：修订 handoff 与开发约束              已完成
S1：工程基线                            已完成
S2：账号安全 + 角色能力包               已完成
S3：系统配置 + 字典 + 文件中心          已完成
S4：知识库 MVP                          暂停，不在当前交付范围
S5：审计运维                            已完成
S6：AI 知识助手预留                     暂停，不在当前交付范围
S7：E2E / 文档 / 交付收口               已完成
S8：消息中心 + 审批基础预留 + 表格导出  已完成
```

## 最新收口事实

- OpenAPI 已改为 NestWeb 源码生成固定契约：`docs/openapi/nestweb.openapi.json`。
- NestWeb CI 已增加 `pnpm run openapi:check`，防止后端 contract 漂移。
- Antdpro6 CI 已增加 `pnpm run openapi:nest:check`，防止前端 generated client 漂移。
- Antdpro6 E2E 已覆盖 S8 审批创建、消息待办、审批处理和 CSV 导出。
- 2026-06-09 已重新部署前后端容器，并完成登录、消息中心、审批列表、文件中心、系统状态页面巡检。
