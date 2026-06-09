# TS 全栈后台下一阶段 Handoff：S9 二开交付包与演示闭环

适用仓库：

- `Gan-Xing/NestWeb`：NestJS + Prisma + PostgreSQL 后端
- `Gan-Xing/Antdpro6`：Umi Max + Ant Design Pro 前端

更新时间：2026-06-09

## 1. 当前判断

当前代码已经不再是“只有权限后台”的阶段。主线能力已经具备：

- RBAC：User / Role / Permission / PermissionGroup / Menu
- 账号安全：用户状态、重置密码、个人中心、登录日志
- 系统能力：字典、系统参数、文件中心、操作日志、系统状态、版本、队列
- 协同基础：消息中心、待办、审批请求基础预留
- 前端交付：产品化路由、Dashboard、错误页、OpenAPI client、E2E
- 工程交付：Docker、migration 拆分、CI、OpenAPI drift check、i18n check、文档清单

因此下一步不建议继续堆新业务模块。当前最重要的工作是：

> 把它做成“拿给别人能看懂、拿到公司能二开、AI 能继续稳定开发”的单企业通用后台交付包。

## 2. 下一阶段名称

```text
S9：二开交付包 + 演示闭环 + 业务接入规范
```

S9 的目标不是新增业务系统，而是把当前底座变成可复用资产：

1. 有演示数据。
2. 有演示流程。
3. 有业务模块接入规范。
4. 有消息中心接入规范。
5. 有审批基础接入规范。
6. 有导出接入规范。
7. 有 E2E 覆盖当前关键工作流。
8. 有一键验收清单。
9. 有明确禁止越界的后续开发边界。

## 3. S9 不做什么

S9 是收口和模板化阶段，严格禁止新增大功能：

```text
不做知识库 Knowledge*
不做 AI / RAG / 向量检索 / 文档分块
不做多租户 Tenant / UserTenant
不做 Department / Position
不做公告
不做导入
不做 BPMN / 流程设计器 / 复杂审批流
不做请假 / 加班 / 报销等具体业务页面
不做大范围 UI 重构
```

## 4. 为什么下一步不是继续做功能

当前项目已经有很多后台基础能力，但还缺少“可交付感”。如果继续加业务页面，会让系统越来越散。

更高价值的下一步是把现有能力打磨成通用底座：

- 新业务如何接入权限？
- 新业务如何接入菜单？
- 新业务如何接入消息中心？
- 新业务如何创建审批请求？
- 新业务如何接入导出？
- 新业务如何写 OpenAPI、E2E、文档？
- 如何一键演示当前系统？
- 如何判断一次改动是否可发布？

这些问题解决后，你以后进任何公司，都能把这套项目当成“业务后台起步模板”。

## 5. S9 任务清单

### 5.1 演示数据与演示脚本

后端新增或增强 demo seed 能力，但不要污染生产 seed。

建议做法：

```text
pnpm run db:seed          生产/基础 seed
pnpm run db:seed:demo     演示数据 seed，可选执行
```

演示数据包含：

- 演示用户：
  - manager@example.com
  - operator@example.com
  - finance@example.com
  - viewer@example.com
- 演示角色绑定：
  - manager
  - operator
  - finance
  - viewer
- 演示消息：
  - 通知类 message
  - 待办类 todo
- 演示审批请求：
  - 一个待审批
  - 一个已通过
  - 一个已驳回
  - 一个已取消
- 演示文件：
  - 可以只创建元数据，不一定上传真实文件
- 演示字典 / 系统参数：
  - 使用当前已有 seed 即可，必要时补说明

注意：

- demo seed 必须幂等。
- demo 账号密码不能用于生产。
- 生产环境默认不自动执行 demo seed。
- README 必须明确 demo seed 仅用于本地演示。

### 5.2 S8 工作流测试补齐

后端建议补单元测试或 service 测试：

- 用户只能查看自己的消息。
- `message.manage` 或 admin 可以查看全部消息。
- 创建审批请求会生成待办。
- 审批通过会完成审批人待办，并通知申请人。
- 审批驳回会完成审批人待办，并通知申请人。
- 审批取消会取消待办，并通知申请人。
- 非审批人不能通过 / 驳回。
- 申请人可以取消自己的 pending 审批。
- 已处理审批不能重复处理。

前端 E2E 建议补：

- 消息中心：待办 / 通知 / 已处理 tab。
- 消息中心：标记已读 / 全部已读 / 完成待办。
- 审批请求：新建审批。
- 审批请求：待我审批 tab 能看到请求。
- 审批请求：审批通过后状态变化。
- 退出后访问 `/message-center` / `/approvals/requests` 跳登录或 403。
- 当前页导出按钮存在且空数据时给出提示。

### 5.3 二开接入文档

新增文档：

```text
docs/development/business-module-guide.md
docs/development/message-center-integration.md
docs/development/approval-lite-integration.md
docs/development/table-export-guide.md
docs/development/openapi-workflow.md
docs/development/e2e-guide.md
docs/demo/demo-script.md
```

#### business-module-guide.md

必须说明新增一个业务模块时要做什么：

- Prisma model
- DTO / Entity
- Service / Controller
- Permission code
- Seed menu
- OpenAPI generation
- Antd route
- access.ts
- ProTable page
- TableExportButton
- E2E
- docs/pages.md
- docs/permissions.md

#### message-center-integration.md

说明业务模块如何创建：

- 通知
- 待办
- 完成待办
- 取消待办
- 使用 `businessType + businessId` 关联业务

#### approval-lite-integration.md

说明 Approval Lite 的边界：

- 它不是完整审批流。
- 它没有流程模板。
- 它没有节点流转。
- 它只提供单步审批请求。
- 任意业务可以用 `businessType + businessId` 关联。
- 审批人可以是用户或角色。
- 审批结果需要业务模块自行响应或查询。

#### table-export-guide.md

说明当前导出策略：

- 当前页导出。
- 前端 CSV。
- 不做导入。
- 不做后端全量异步导出。
- 大数据量导出未来另开专项。

### 5.4 交付清单增强

更新：

```text
docs/pages.md
docs/permissions.md
docs/release-checklist.md
docs/ops-runbook.md
docs/deployment.md
README.md
```

新增或确认：

- S8 已完成。
- S9 当前阶段是二开交付包。
- S4 知识库仍暂停。
- S6 AI 仍暂停。
- Approval Lite 不是完整审批流。
- 当前导出是当前页导出。
- Department / Position 仍是未来可选扩展。

### 5.5 质量门禁

确认 CI 至少覆盖：

NestWeb：

```bash
pnpm run lint:check
pnpm test -- --runInBand
pnpm run build
pnpm run openapi:check
pnpm run i18n:check
```

Antdpro6：

```bash
pnpm run tsc
pnpm test -- --runInBand
pnpm run build
pnpm run openapi:nest:check
pnpm run i18n:check
pnpm run e2e
```

如果 E2E 需要外部环境变量，保持当前策略：

```text
E2E_BASE_URL
E2E_ADMIN_EMAIL
E2E_ADMIN_PASSWORD
```

CI 中缺失可安全跳过，但文档中必须说明本地完整验收需要配置。

## 6. S9 验收标准

S9 完成后应满足：

1. 新人能根据 README 和 docs 启动系统。
2. 新人能根据 demo-script 演示：
   - 登录
   - Dashboard
   - 用户 / 角色 / 权限
   - 字典 / 系统参数 / 文件中心
   - 操作日志 / 登录日志
   - 消息中心
   - 审批请求
   - 导出当前页
3. 开发者能根据 business-module-guide 新增一个业务模块。
4. 开发者能根据 approval-lite-integration 把任意业务接入审批请求。
5. 开发者能根据 message-center-integration 给任意业务创建通知 / 待办。
6. 文档明确 S4 / S6 暂停，不会误导 AI 继续做知识库或 AI。
7. 权限码、页面、seed、OpenAPI 保持同步。
8. 验收命令通过。

## 7. S9 Prompt

```text
请只执行 S9：二开交付包 + 演示闭环 + 业务接入规范。

当前状态：
S0/S1/S2/S3/S5/S7/S8 已完成。当前项目已经具备单企业后台底座、消息中心、Approval Lite、当前页导出、OpenAPI drift check、i18n check 和基础 E2E。

本阶段目标：
不要继续新增业务大功能，而是把当前系统整理成可演示、可交付、可二开的单企业通用后台模板。

严格禁止：
- 不做知识库，不新增 Knowledge*
- 不做 AI/RAG/向量检索/文档分块
- 不做多租户，不新增 Tenant/UserTenant
- 不做 Department/Position
- 不做公告
- 不做导入
- 不做 BPMN/流程设计器/复杂审批流
- 不做请假/加班/报销等具体业务页面
- 不做大范围 UI 重构

NestWeb：
1. 增加可选 demo seed：
   - 建议新增 pnpm run db:seed:demo
   - demo seed 幂等
   - 不在生产自动执行
   - 包含演示用户、角色绑定、消息、待办、审批请求、可选文件元数据
2. 补 S8 后端测试：
   - 用户只能看自己的消息
   - message.manage/admin 可看全部消息
   - 创建审批请求生成待办
   - 审批通过/驳回会完成待办并通知申请人
   - 审批取消会取消待办并通知申请人
   - 非审批人不能通过/驳回
   - 已处理审批不能重复处理
3. 检查 seed、权限码、菜单、OpenAPI、文档是否与当前代码一致。
4. 不新增业务模型，除 demo seed 必须数据外不改 schema。

Antdpro6：
1. 补 E2E 或完善已有 E2E：
   - 消息中心 tab
   - 标记已读/全部已读/完成待办
   - 新建审批请求
   - 待我审批 tab
   - 审批通过后状态变化
   - 消息/审批页面权限访问
   - 导出按钮存在和空数据提示
2. 检查主要表格导出覆盖：
   - 用户、角色、权限、菜单、字典、系统参数、文件、操作日志、登录日志、消息中心、审批请求
3. 不做大范围 UI 重构，只修复明显 bug 和交付体验问题。

文档：
新增或更新：
- docs/development/business-module-guide.md
- docs/development/message-center-integration.md
- docs/development/approval-lite-integration.md
- docs/development/table-export-guide.md
- docs/development/openapi-workflow.md
- docs/development/e2e-guide.md
- docs/demo/demo-script.md
- docs/pages.md
- docs/permissions.md
- docs/release-checklist.md
- docs/ops-runbook.md
- README.md

文档必须明确：
- S4 知识库暂停
- S6 AI 暂停
- Approval Lite 不是完整审批流
- 当前导出是当前页导出
- Department/Position 是未来可选扩展
- 如何新增业务模块
- 如何接入消息中心
- 如何接入 Approval Lite
- 如何接入导出

验收命令：
NestWeb:
- pnpm run lint:check
- pnpm test -- --runInBand
- pnpm run build
- pnpm run openapi:check
- pnpm run i18n:check

Antdpro6:
- pnpm run tsc
- pnpm test -- --runInBand
- pnpm run build
- pnpm run openapi:nest:check
- pnpm run i18n:check
- pnpm run e2e

完成后输出：
- 修改文件清单
- demo seed 内容
- 新增/更新测试清单
- 新增/更新文档清单
- 导出覆盖清单
- 权限码/seed/OpenAPI 是否变化
- 验收命令结果
- 风险点
- 回滚方式
```

## 8. S9 之后的方向

S9 后不要继续盲目加功能。建议只在下面三个方向里选择一个：

### 方向 A：知识库专项研究

适合你研究清楚 RAG / 文档模型 / 权限过滤以后再启动。

### 方向 B：具体业务样板

选择一个简单但完整的业务，例如“工单管理 / 资产管理 / 采购申请”，把它作为业务接入样板。

### 方向 C：安全升级

把 refresh token 从本地存储迁移到 HttpOnly Cookie，并做 token rotation / reuse detection。

当前最建议：先完成 S9，然后暂停功能开发，整理作品集和演示脚本。
