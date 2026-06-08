# TS 全栈单企业通用后台 Handoff v2

适用仓库：

- `Gan-Xing/NestWeb`：NestJS + Prisma + PostgreSQL 后端
- `Gan-Xing/Antdpro6`：Umi Max + Ant Design Pro 前端

当前目标：把现有 TS 全栈后台从“单企业后台基线”完善成“可复用、可二开、可展示能力、可快速套业务”的单企业通用管理平台。

本版本修正旧 handoff 的组织 / 岗位路线：**Department / Position 不进入当前阶段任务**。当前更适合把 `Role` 作为“岗位 / 职责 / 能力包”，再补账号安全、系统配置、文件中心、知识库、审计运维和 AI 预留能力。

---

## 0. 当前阶段状态

更新时间：2026-06-08

```text
S0：修订 handoff 与开发约束              已完成
S1：工程基线                            已完成
S2：账号安全 + 角色能力包               已完成
S3：系统配置 + 字典 + 文件中心          已完成
S4：知识库 MVP                          暂停，不在当前交付范围
S5：审计运维                            已完成
S6：AI 知识助手预留                     暂停，不在当前交付范围
S7：E2E / 文档 / 交付收口               已完成
```

当前交付约束：

- 不新增 KnowledgeSpace / KnowledgeDocument / KnowledgeTag。
- 不新增 RAG / 向量检索 / 文档分块。
- 不新增 Tenant / UserTenant。
- 不新增 Department / Position。
- 不重构 RBAC。
- S7 只补 E2E、错误页、空状态、文档和发布检查清单。

---

## 1. 当前判断

### 1.1 已具备的基础

当前两个仓库已经完成了很多企业后台底座能力：

- 后端已经有 `User / Role / Permission / PermissionGroup / Menu` 基础 RBAC。
- `Role.code` 已经作为稳定系统身份落地，`Role.name` 只做显示名。
- 前端已经从 Ant Design Pro 模板感迁移到“企业管理平台”，默认首页切到 `/dashboard`。
- Playwright E2E 已覆盖登录、刷新页面、退出、token refresh。
- 后端已有 runtime config 校验、Swagger/CORS/metrics 保护、Helmet、限流、日志脱敏。
- Docker 启动已拆出 migration，Compose 里有一次性 `migrate` 服务。
- README 和企业交付文档已有基础。

### 1.2 当前仍需完善的问题

当前最重要的问题不是“上多租户”，也不是“做完整 OA”，而是把单企业通用后台补齐到可以快速开发业务项目的程度。

现阶段仍需补：

- 工程基线：ValidationPipe、DTO、Prisma 生命周期、异常脱敏、Nginx headers、Dashboard summary。
- 账号安全：用户禁用、最近登录、登录日志、管理员重置密码、用户修改密码、个人中心。
- 角色能力包：Role 增加职责说明，常用角色 seed，权限码文档化。
- 系统配置：字典、系统参数、文件配置查看、注册开关、密码策略。
- 文件中心：上传、列表、预览、下载、附件复用。
- 知识库：知识空间、知识文档、标签、附件、版本、访问控制。
- 审计运维：操作日志详情、系统状态、版本信息、队列状态、健康检查增强。
- AI 预留：文档分块、全文搜索、向量字段预留、引用来源、按角色过滤知识。

---

## 2. 关键产品决策

### 2.1 Department / Position 作为未来可选扩展

旧 handoff 曾建议增加：

```text
/organization/departments
/organization/positions
```

现在调整为：**当前阶段不做，未来按触发条件再做**。

原因：

1. 当前系统已有 `Role + Permission`，一个用户可以拥有多个角色，一个角色可绑定多个权限。
2. 很多业务项目里，角色天然就是岗位、职责、能力包，例如“项目经理”“资料员”“财务”“仓库管理员”。
3. Department / Position 只有在出现组织树、部门数据隔离、部门负责人审批、HR 编制、按部门统计时才是强需求。
4. 过早引入部门 / 岗位，会让通用后台更像 OA/HR，而不是轻量业务开发底座。
5. 当前更应该把 Role 打磨成通用“能力包”，而不是拆出两套相似模型。

### 2.2 Role 作为岗位 / 职责 / 能力包

当前统一规则：

```text
Role.code：系统稳定身份，例如 admin、finance、viewer、knowledge_admin
Role.name：显示名，例如 系统管理员、财务、只读用户、知识库管理员
Role.description：职责说明 / 使用场景 / 适用人群
Role.permissions：权限集合
```

一个用户可以拥有多个 Role：

```text
site_engineer + document_clerk
project_manager + finance_viewer
knowledge_admin + viewer
```

这比单独 Position 更灵活，也更适合通用业务后台。

### 2.3 Department / Position 的触发条件

以后只有出现下列需求时，再加 Department：

```text
- 按部门隔离数据
- 本部门 / 本部门及下级数据权限
- 审批流需要找“提交人所在部门负责人”
- 通讯录或组织树展示
- 报表按部门统计
```

以后只有出现下列需求时，再加 Position：

```text
- 岗位要与薪资、编制、绩效、招聘绑定
- 岗位不等于权限角色
- 审批节点要使用岗位，而不是权限角色
- 一个岗位下多人，但权限可能因项目不同而不同
```

当前不做。

### 2.4 知识库作为通用后台核心能力

知识库是推荐新增的通用模块，原因：

1. 它通用：制度、说明、FAQ、项目资料、操作手册、复盘文档都能用。
2. 它能展示全栈能力：文件、权限、富文本、版本、搜索、附件、审计。
3. 它能自然接 AI：RAG、文档问答、来源引用、自动总结。
4. 它比传统组织模块更容易在求职和项目展示中体现价值。
5. 它可以成为未来任何业务系统的知识沉淀中心。

当前策略：**先做知识库基础，不一开始做 AI。**

---

## 3. 新路线图

### 总体阶段

```text
S0：修订 handoff 与开发约束
S1：工程基线
S2：账号安全 + 角色能力包
S3：系统配置 + 字典 + 文件中心
S4：知识库 MVP
S5：审计运维
S6：AI 知识助手预留
S7：E2E / 文档 / 交付收口
```

明确不做：

```text
- 不做多租户
- 不做 Tenant / UserTenant
- Department / Position 仅作为未来可选扩展，只有组织树、部门数据隔离、部门审批时再做
- 不做复杂审批流
- 不做流程引擎
- 不做低代码平台
- 不直接把 DailyWork 迁进来
```

---

## 4. 目标页面清单

### 4.1 保留和增强现有页面

```text
/dashboard                         工作台
/auth/users                        用户管理
/auth/roles                        角色能力包 / 角色管理
/auth/permissions                  权限管理
/auth/menus                        菜单管理
/resources/images                  图片资源
/system/logs                       操作日志
```

### 4.2 新增单企业通用页面

```text
/account/profile                   个人中心
/security/login-logs               登录日志
/system/dicts                      字典管理
/system/config                     系统参数
/system/files                      文件中心
/system/status                     系统状态
/system/version                    版本信息
/system/queues                     队列状态
```

### 4.3 新增知识库页面

```text
/knowledge                         知识库首页
/knowledge/spaces                  知识空间
/knowledge/documents               知识文档
/knowledge/tags                    标签管理
/knowledge/assistant               AI 知识助手预留页，S6 做
```

### 4.4 暂不做，但保留扩展位

```text
/organization/departments          暂不做，未来需要组织树时再做
/organization/positions            暂不做，未来岗位独立于角色时再做
/approval                          暂不做，未来需要审批流时再做
```

---

## 5. 数据模型规划

### 5.1 Role 增强

当前已有：

```text
Role.id
Role.code
Role.name
Role.permissions
Role.users
```

建议新增：

```text
Role.description String?
Role.sort Int @default(0)
Role.enabled Boolean @default(true)
```

不要新增：

```text
Role.isSystem
Role.isProtected
```

当前继续通过 `code === "admin"` 保护内置管理员角色。

### 5.2 用户账号安全增强

建议 User 增加或确认：

```text
status: active / disabled / resigned
lastLoginAt DateTime?
lastLoginIp String?
passwordUpdatedAt DateTime?
```

如果已有 status 字段，统一枚举语义，不一定要强制改 enum。

新增 LoginLog：

```prisma
model LoginLog {
  id          Int      @id @default(autoincrement())
  userId      Int?
  username    String?
  email       String?
  success     Boolean
  failureCode String?
  failureMsg  String?
  ip          String
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([success, createdAt])
  @@index([ip, createdAt])
}
```

### 5.3 字典与系统配置

```prisma
model DictType {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  description String?
  enabled     Boolean  @default(true)
  items       DictItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DictItem {
  id          Int      @id @default(autoincrement())
  typeId      Int
  label       String
  value       String
  sort        Int      @default(0)
  enabled     Boolean  @default(true)
  extra       Json?
  type        DictType @relation(fields: [typeId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([typeId, value])
  @@index([typeId, sort])
}

model SystemConfig {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  type        String   @default("string")
  group       String   @default("default")
  description String?
  editable    Boolean  @default(true)
  updatedById Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 5.4 文件中心

```prisma
model FileAsset {
  id           Int      @id @default(autoincrement())
  bucket       String?
  objectKey    String
  fileName     String
  mimeType     String?
  size         Int
  url          String?
  checksum     String?
  sourceModule String?
  createdById  Int?
  createdAt    DateTime @default(now())

  @@index([sourceModule, createdAt])
  @@index([createdById, createdAt])
}
```

### 5.5 知识库 MVP

```prisma
model KnowledgeSpace {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  description String?
  visibility  String   @default("restricted") // public / restricted
  sort        Int      @default(0)
  enabled     Boolean  @default(true)
  createdById Int?
  updatedById Int?
  documents   KnowledgeDocument[]
  accesses    KnowledgeAccess[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model KnowledgeDocument {
  id          Int      @id @default(autoincrement())
  spaceId     Int
  title       String
  summary     String?
  content     String
  status      String   @default("draft") // draft / published / archived
  sourceType  String   @default("manual") // manual / import / daily_report / other
  createdById Int?
  updatedById Int?
  space       KnowledgeSpace @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  tags        KnowledgeDocumentTag[]
  versions    KnowledgeDocumentVersion[]
  attachments KnowledgeAttachment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([spaceId, status, updatedAt])
  @@index([createdById, createdAt])
}

model KnowledgeTag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String?
  documents KnowledgeDocumentTag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model KnowledgeDocumentTag {
  documentId Int
  tagId      Int
  document   KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  tag        KnowledgeTag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([documentId, tagId])
}

model KnowledgeDocumentVersion {
  id          Int      @id @default(autoincrement())
  documentId  Int
  title       String
  summary     String?
  content     String
  version     Int
  createdById Int?
  document    KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([documentId, version])
}

model KnowledgeAttachment {
  id          Int      @id @default(autoincrement())
  documentId  Int
  fileAssetId Int?
  fileName    String
  url         String?
  mimeType    String?
  size        Int?
  document    KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}

model KnowledgeAccess {
  id        Int      @id @default(autoincrement())
  spaceId   Int
  roleId    Int
  access    String   // view / edit / manage
  space     KnowledgeSpace @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  role      Role           @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([spaceId, roleId, access])
}
```

### 5.6 AI 预留模型

S6 再做，不在知识库 MVP 第一阶段落地全部功能。

```prisma
model KnowledgeChunk {
  id          Int      @id @default(autoincrement())
  documentId  Int
  chunkIndex  Int
  content     String
  tokenCount  Int?
  embedding   Unsupported("vector")?
  createdAt   DateTime @default(now())

  @@unique([documentId, chunkIndex])
}
```

如暂时不启用 pgvector，可以先不用 `embedding`，只做 `content` 和全文搜索预留。

---

## 6. 权限码规划

### 6.1 账号与角色

```text
account.profile.view
account.profile.update
account.password.change

security.loginLogs.view
security.loginLogs.export

system.users.view
system.users.create
system.users.update
system.users.disable
system.users.resetPassword

system.roles.view
system.roles.create
system.roles.update
system.roles.delete
system.roles.assignPermissions
```

如果当前已有 `auth.users.*`、`auth.roles.*`，优先沿用现有命名，不强行重命名；新增权限可兼容映射。

### 6.2 系统配置

```text
system.dicts.view
system.dicts.create
system.dicts.update
system.dicts.delete
system.config.view
system.config.update
system.files.view
system.files.upload
system.files.delete
system.status.view
system.version.view
system.queues.view
```

### 6.3 知识库

```text
knowledge.view
knowledge.spaces.view
knowledge.spaces.create
knowledge.spaces.update
knowledge.spaces.delete
knowledge.spaces.manageAccess

knowledge.documents.view
knowledge.documents.create
knowledge.documents.update
knowledge.documents.delete
knowledge.documents.publish
knowledge.documents.archive
knowledge.documents.manage

knowledge.tags.view
knowledge.tags.create
knowledge.tags.update
knowledge.tags.delete

knowledge.assistant.view
knowledge.assistant.ask
knowledge.chunks.manage
```

---

## 7. 阶段任务与验收

## S0：修订 handoff 与开发约束

目标：把旧文档中 Department / Position 相关路线下调为未来可选扩展，明确新路线。

任务：

- 更新当前文档 `NestWeb/docs/handoff/ts-fullstack-single-enterprise-handoff-v2.md`。
- 明确 `Role = 岗位 / 职责 / 能力包`。
- 明确 Department / Position 作为未来可选扩展，只有组织树、部门数据隔离、部门审批时再做。
- 明确知识库是单企业通用后台主线模块。
- 本阶段只修改 handoff 与开发约束，不改业务代码，不改 schema，不做 migration。

验收：

- 文档中没有把 Department / Position 放在当前阶段任务。
- 文档中明确 Role 承担岗位 / 职责 / 能力包表达。
- 文档中明确 Department / Position 只有在组织树、部门数据隔离、部门审批等场景出现后再做。
- 文档中有知识库 MVP 和 AI 预留路线。
- 文档中有页面清单、模型草案、权限码清单、阶段验收标准。

---

## S1：工程基线

目标：先修底座，不上新业务大功能。

NestWeb：

1. 强化全局 ValidationPipe：
   - `whitelist: true`
   - `forbidNonWhitelisted: true`
   - `transform: true`
   - `transformOptions.enableImplicitConversion: true`
   - `forbidUnknownValues: true`
2. AuthController 中 `@Body() body: any` 改 DTO。
3. PrismaService 增加 `onModuleInit` / `onModuleDestroy`。
4. HttpFilter 不返回 Prisma 原始错误，P2002 返回业务友好文案。
5. 新增 `GET /api/dashboard/summary`，前端 Dashboard 优先使用该接口。
6. readiness 文档明确当前检查项，后续可补 RabbitMQ / MinIO。

Antdpro6：

1. 删除前端保存密码残留逻辑。
2. 清理重复 `@playwright/test`。
3. `nginx.conf` 增加基础安全响应头。
4. Dashboard 改为优先使用 `/api/dashboard/summary`。

验收：

```bash
# NestWeb
pnpm run lint:check
pnpm test -- --runInBand
pnpm run build

# Antdpro6
pnpm run tsc
pnpm test -- --runInBand
pnpm run build
```

---

## S2：账号安全 + 角色能力包

目标：用 Role 表达岗位/职责/能力包，增强账号安全能力。

NestWeb：

1. Role 增加 `description`、`sort`、`enabled`。
2. seed 增加常用角色：
   - `admin`
   - `manager`
   - `operator`
   - `finance`
   - `viewer`
   - `knowledge_admin`
3. 用户状态统一：`active / disabled / resigned`。
4. 禁用用户禁止登录。
5. 登录成功/失败写 LoginLog。
6. 新增管理员重置密码接口。
7. 新增用户修改密码接口。
8. 用户详情返回角色、权限、最近登录。

Antdpro6：

1. 角色页面增加 `description` 字段。
2. 用户详情抽屉展示基本信息、角色、权限、最近登录。
3. 用户列表支持启用 / 禁用。
4. 新增管理员重置密码操作。
5. 新增 `/account/profile`。
6. 新增 `/security/login-logs`。

验收：

- 禁用用户无法登录。
- 登录成功和失败都有日志。
- 管理员能重置用户密码。
- 当前用户能修改自己的密码。
- Role.description 在前后端都可维护。
- OpenAPI 重新生成并通过 typecheck。

---

## S3：系统配置 + 字典 + 文件中心

目标：补通用后台常用配置能力和文件能力。

NestWeb：

1. 新增 DictType / DictItem。
2. 新增 SystemConfig。
3. 新增 FileAsset。
4. 新增字典 CRUD。
5. 新增系统参数查询 / 更新。
6. 新增文件上传 / 列表 / 删除。
7. seed 初始化常用字典：
   - 用户状态
   - 性别
   - 图片分类
   - 知识文档状态
   - 知识空间可见性

Antdpro6：

1. 新增 `/system/dicts`。
2. 新增 `/system/config`。
3. 新增 `/system/files`。
4. 常用下拉项优先读取字典，失败时 fallback 本地枚举。

验收：

- 字典类型和字典项可维护。
- 系统参数可查看，只有 editable=true 可修改。
- 文件可上传、下载、删除。
- 文件中心可作为后续知识库附件复用。

---

## S4：知识库 MVP

目标：做一个不依赖 AI 的企业知识库基础模块。

NestWeb：

1. 新增 KnowledgeSpace。
2. 新增 KnowledgeDocument。
3. 新增 KnowledgeTag。
4. 新增 KnowledgeDocumentTag。
5. 新增 KnowledgeDocumentVersion。
6. 新增 KnowledgeAttachment。
7. 新增 KnowledgeAccess。
8. 接口：
   - `GET /api/knowledge/overview`
   - `GET /api/knowledge/spaces`
   - `POST /api/knowledge/spaces`
   - `PATCH /api/knowledge/spaces/:id`
   - `DELETE /api/knowledge/spaces/:id`
   - `GET /api/knowledge/documents`
   - `POST /api/knowledge/documents`
   - `GET /api/knowledge/documents/:id`
   - `PATCH /api/knowledge/documents/:id`
   - `DELETE /api/knowledge/documents/:id`
   - `POST /api/knowledge/documents/:id/publish`
   - `POST /api/knowledge/documents/:id/archive`
   - `GET /api/knowledge/tags`
   - `POST /api/knowledge/tags`
   - `PATCH /api/knowledge/tags/:id`
   - `DELETE /api/knowledge/tags/:id`
9. 知识库访问控制：按 Role 授权 view/edit/manage。

Antdpro6：

1. 新增菜单 `/knowledge`。
2. 新增 `/knowledge/spaces`。
3. 新增 `/knowledge/documents`。
4. 新增 `/knowledge/tags`。
5. 知识文档支持：列表、创建、编辑、详情、发布、归档、标签、附件。
6. 知识空间支持：角色访问控制配置。

验收：

- 普通 viewer 只能看被授权的知识空间。
- knowledge_admin 可以管理知识空间和文档。
- 文档每次更新生成版本记录。
- 文档发布后进入可查看状态。
- 文档归档后默认列表隐藏。
- OpenAPI 生成正常。

---

## S5：审计运维

目标：让系统有企业运维可见性。

NestWeb：

1. 增强操作日志详情。
2. 登录日志分页、详情、导出。
3. 新增 `/api/system/status`：DB / Redis / RabbitMQ / MinIO / Queue。
4. 新增 `/api/system/version`：版本号、commit、build time、node version。
5. 新增 `/api/system/queues`：waiting / active / failed / completed。

Antdpro6：

1. `/system/logs` 增加详情抽屉。
2. `/security/login-logs` 完整查询。
3. `/system/status`。
4. `/system/version`。
5. `/system/queues`。

验收：

- 运维页面不暴露敏感配置。
- 失败队列可见。
- 版本信息可用于排查线上问题。
- 日志查询支持按用户、状态、时间、URL 过滤。

---

## S6：AI 知识助手预留

目标：为 AI 知识库做准备，不强行一次性接大模型。

NestWeb：

1. 新增 KnowledgeChunk 或预留 chunk 服务。
2. 文档发布时可生成 chunk。
3. 先支持全文搜索。
4. 预留 embedding 字段或独立表。
5. 预留 assistant 接口，但可以先返回 mock 或关闭。

Antdpro6：

1. 新增 `/knowledge/assistant` 页面。
2. 先做搜索式问答 UI。
3. 展示引用来源区域。
4. 未启用 AI 时显示“AI 功能未启用”。

验收：

- 不启用 AI 时系统正常。
- 知识文档能被全文搜索。
- assistant 页面有权限控制。
- 后续接 LLM 时无需推翻知识库模型。

---

## S7：E2E / 文档 / 交付收口

目标：把新模块纳入回归和交付材料。

任务：

1. E2E 增加：
   - 登录失败
   - 禁用用户登录失败
   - 用户管理基本流
   - 角色 description 修改
   - 字典管理
   - 知识空间创建
   - 知识文档创建 / 发布 / 查看
2. 更新 README。
3. 更新权限码清单。
4. 更新部署文档。
5. 更新备份恢复文档。
6. 更新 handoff 当前状态。

验收：

- CI 通过。
- E2E 可手动触发。
- 新模块权限码有文档。
- 新环境变量有文档。
- 有回滚说明。

---

## 8. AI 开发监督规则

每次让 AI 开发，都必须要求它输出：

```text
1. 本次任务范围
2. 明确不做什么
3. 修改文件清单
4. 数据库 migration 说明
5. 是否需要重新生成 OpenAPI
6. 新增权限码
7. seed 变化
8. 验收命令
9. 风险点
10. 回滚方式
```

每次 PR 不能混入：

```text
- 多租户
- Department / Position
- 大规模 UI 重构
- 重命名现有权限码
- 删除已有模块
- 不可回滚 migration
```

---

## 9. 总控 Prompt

```text
你正在协助我完善两个仓库：
- Gan-Xing/NestWeb：NestJS + Prisma + PostgreSQL 后端
- Gan-Xing/Antdpro6：Umi Max + Ant Design Pro 前端

目标：把当前项目完善成“单企业通用后台开发底座”。

当前已完成：
- Role.code 已完成，Role.name 是显示名，Role.code 是系统身份。
- 前端已产品化，默认首页为 /dashboard。
- Playwright E2E 已覆盖登录、刷新页面、退出、token refresh。
- 基础安全已有：runtime config 校验、CORS/Swagger/metrics、Helmet、限流、日志脱敏。
- migration 已从 API 启动拆出。
- health/live/ready 已存在。
- S0 已完成：当前 handoff 已明确单企业路线、Role 能力包、Department / Position 未来可选扩展。
- S1 已完成：工程基线已覆盖严格 ValidationPipe、Auth DTO、Prisma 生命周期、Prisma 错误脱敏、Dashboard summary、前端 Dashboard 聚合接口、nginx 安全响应头、前端保存密码残留清理。

本轮路线调整：
- Department / Position 仅作为未来可选扩展。
- Role 作为岗位 / 职责 / 能力包。
- 新主线是：工程基线、账号安全、角色能力包、系统配置、文件中心、知识库、审计运维、AI 知识助手预留。

严格限制：
- 不要做多租户。
- 不要新增 Tenant / UserTenant。
- 不要新增 Department。
- 不要新增 Position。
- 不要做复杂审批流。
- 不要重构 RBAC。
- 不要直接迁移 dailywork 业务。
- 不要一开始就做完整 AI，只先做知识库基础和 AI 预留。

开发顺序：
S0 修订 handoff 与开发约束
S1 工程基线
S2 账号安全 + 角色能力包
S3 系统配置 + 字典 + 文件中心
S4 知识库 MVP
S5 审计运维
S6 AI 知识助手预留
S7 E2E / 文档 / 交付收口

每个阶段完成后必须输出：
1. 修改文件清单
2. 数据库 migration 说明
3. 是否需要重新生成 OpenAPI
4. 新增权限码
5. seed 变化
6. 验收命令结果
7. 风险点
8. 回滚方式

验收命令：
NestWeb:
- pnpm run lint:check
- pnpm test -- --runInBand
- pnpm run build

Antdpro6:
- pnpm run tsc
- pnpm test -- --runInBand
- pnpm run build

请先阅读当前代码和 docs/handoff，再只执行我指定的阶段。不要越界开发。
```

---

## 10. 阶段 Prompt

### S0 Prompt

```text
请只执行 S0：修订 handoff 与开发约束。

任务：
1. 在 NestWeb 中更新 docs/handoff/ts-fullstack-single-enterprise-handoff-v2.md。
2. 删除旧 handoff 中 Department / Position 作为当前阶段任务的表达。
3. 明确 Role 作为岗位 / 职责 / 能力包。
4. 明确 Department / Position 作为未来可选扩展，只有组织树、部门数据隔离、部门审批时再做。
5. 新路线改为：
   S1 工程基线
   S2 账号安全 + 角色能力包
   S3 系统配置 + 字典 + 文件中心
   S4 知识库 MVP
   S5 审计运维
   S6 AI 知识助手预留
   S7 E2E / 文档 / 交付收口
6. 不改业务代码。
7. 不改 schema。
8. 不做 migration。

输出：
- 修改文件清单
- 文档主要变更
- 后续建议从 S1 开始
```

### S1 Prompt

```text
请只执行 S1：工程基线。

NestWeb：
1. 强化全局 ValidationPipe：whitelist、forbidNonWhitelisted、transform、enableImplicitConversion、forbidUnknownValues。
2. AuthController 中 exchange-code-for-user 和 miniprogram-login 的 any body 改 DTO。
3. PrismaService 增加 onModuleInit / onModuleDestroy。
4. HttpFilter 不返回 Prisma 原始错误，P2002 返回业务友好文案。
5. 新增 GET /api/dashboard/summary，聚合 health、用户数、角色数、图片数、最近日志。
6. 保持现有接口路径不变。

Antdpro6：
1. 删除未使用的前端保存密码残留逻辑。
2. 清理 package.json 里重复 @playwright/test。
3. nginx.conf 增加基础安全响应头。
4. Dashboard 优先使用 /api/dashboard/summary。

不要做：
- 不要新增 Department / Position。
- 不要新增知识库。
- 不要做多租户。
- 不要改大范围 UI。

验收：
- NestWeb: pnpm run lint:check && pnpm test -- --runInBand && pnpm run build
- Antdpro6: pnpm run tsc && pnpm test -- --runInBand && pnpm run build

输出修改文件清单、OpenAPI 是否需重新生成、风险点、回滚方式。
```

### S2 Prompt

```text
请只执行 S2：账号安全 + 角色能力包。

理念：Role 就是岗位 / 职责 / 能力包，不新增 Position，不新增 Department。

NestWeb：
1. Role 增加 description、sort、enabled。
2. CreateRoleDto / UpdateRoleDto / RoleEntity 同步字段。
3. RolesService 支持维护 description、sort、enabled。
4. seed 增加常用角色：admin、manager、operator、finance、viewer、knowledge_admin。
5. 用户状态统一：active / disabled / resigned。若已有 status 字段，复用该字段。
6. 禁用用户禁止登录。
7. 新增 LoginLog，记录登录成功/失败、IP、UA、失败原因。
8. 新增管理员重置用户密码接口。
9. 新增当前用户修改密码接口。
10. 当前用户信息接口返回最近登录信息。

Antdpro6：
1. 角色页面增加 description、sort、enabled。
2. 用户列表支持启用 / 禁用。
3. 用户详情抽屉展示角色、权限、最近登录。
4. 新增管理员重置密码操作。
5. 新增 /account/profile 页面。
6. 新增 /security/login-logs 页面。

权限码按现有 auth.* 体系扩展，不强行重命名已有权限。

不要做：
- 不要新增 Department。
- 不要新增 Position。
- 不要做审批流。
- 不要做多租户。

验收：
- 禁用用户无法登录。
- 登录成功/失败均写 LoginLog。
- 管理员能重置密码。
- 当前用户能修改密码。
- Role.description 可维护。
- OpenAPI 已生成并通过前端 typecheck。
```

### S3 Prompt

```text
请只执行 S3：系统配置 + 字典 + 文件中心。

NestWeb：
1. 新增 DictType / DictItem 模型和 CRUD。
2. 新增 SystemConfig 模型和查询/更新接口。
3. 新增 FileAsset 模型。
4. 新增文件上传、文件列表、文件删除接口，复用现有 Storage/MinIO 能力。
5. seed 初始化常用字典：用户状态、性别、图片分类、知识文档状态、知识空间可见性。

Antdpro6：
1. 新增 /system/dicts 页面。
2. 新增 /system/config 页面。
3. 新增 /system/files 页面。
4. 常用下拉优先读取字典，失败时 fallback 本地枚举。

不要做：
- 不要新增知识库业务表。
- 不要做 AI。
- 不要做多租户。

验收：
- 字典可 CRUD。
- 系统参数可查看和更新 editable=true 的项。
- 文件可上传、列表、下载、删除。
- 文件中心可被后续知识库附件复用。
```

### S4 Prompt

```text
请只执行 S4：知识库 MVP，不做 AI。

NestWeb：
1. 新增 KnowledgeSpace。
2. 新增 KnowledgeDocument。
3. 新增 KnowledgeTag。
4. 新增 KnowledgeDocumentTag。
5. 新增 KnowledgeDocumentVersion。
6. 新增 KnowledgeAttachment。
7. 新增 KnowledgeAccess。
8. 新增知识库接口：overview、spaces CRUD、documents CRUD、publish、archive、tags CRUD。
9. 实现按 Role 的知识空间访问控制：view / edit / manage。
10. seed 增加知识库权限码和 knowledge_admin 角色权限。

Antdpro6：
1. 新增菜单 /knowledge。
2. 新增 /knowledge/spaces。
3. 新增 /knowledge/documents。
4. 新增 /knowledge/tags。
5. 文档支持创建、编辑、详情、发布、归档、标签、附件。
6. 知识空间支持角色访问控制配置。

不要做：
- 不做 AI 问答。
- 不做向量检索。
- 不做多租户。
- 不引入 Department / Position。

验收：
- knowledge_admin 可以管理知识库。
- viewer 只能查看被授权内容。
- 文档更新生成版本记录。
- 文档发布后可查看。
- OpenAPI 已重新生成。
```

### S5 Prompt

```text
请只执行 S5：审计运维。

NestWeb：
1. 增强 system-log 详情接口。
2. login-log 支持分页、过滤、详情。
3. 新增 /api/system/status，聚合 DB/Redis/RabbitMQ/MinIO/队列状态。
4. 新增 /api/system/version，返回 package version、commit sha、build time、node version。
5. 新增 /api/system/queues，返回 Bull 队列 waiting/active/failed/completed 数量。

Antdpro6：
1. /system/logs 增加详情抽屉。
2. /security/login-logs 支持查询和详情。
3. 新增 /system/status。
4. 新增 /system/version。
5. 新增 /system/queues。

不要暴露敏感配置值。

验收：
- 管理员可查看系统状态和队列状态。
- 普通用户不可访问运维页面。
- 日志详情敏感字段已脱敏。
```

### S6 Prompt

```text
请只执行 S6：AI 知识助手预留，不接真实大模型。

NestWeb：
1. 新增 KnowledgeChunk 或 chunk 服务，文档发布时可生成文本分块。
2. 先支持全文搜索。
3. 预留 embedding 字段或独立表，但不要求启用 pgvector。
4. 新增 assistant/query 接口，可以在 AI 未启用时返回明确提示。
5. 回答结构必须预留 citations/sources 字段。

Antdpro6：
1. 新增 /knowledge/assistant 页面。
2. 支持输入问题、展示搜索结果、展示引用来源区域。
3. AI 未启用时显示“AI 功能未启用”。
4. 按 knowledge.assistant.view / knowledge.assistant.ask 控制权限。

不要做：
- 不接真实 LLM API。
- 不做复杂 Agent。
- 不做多租户。

验收：
- 文档可分块。
- 可全文搜索知识文档。
- assistant 页面可展示搜索结果和来源。
- 未启用 AI 时系统正常。
```

### S7 Prompt

```text
请只执行 S7：交付收口。

已完成阶段：S1 / S2 / S3 / S5。
暂停阶段：S4 知识库 MVP、S6 AI 知识助手。

严格禁止：
- 不新增 KnowledgeSpace / KnowledgeDocument / KnowledgeTag。
- 不新增 RAG / 向量检索 / 文档分块。
- 不新增 Tenant / UserTenant。
- 不新增 Department / Position。
- 不重构 RBAC。
- 不新增大功能。

Antdpro6：
1. Playwright E2E 覆盖登录成功、登录失败、刷新保持登录、token refresh、退出登录、退出后访问保护页跳登录。
2. E2E 覆盖 Dashboard、/system/status、/system/version、/system/queues、/security/login-logs。
3. E2E 覆盖无权限菜单不可见或直接访问受限。
4. 补 403、500、网络异常 / 请求失败 Result、统一表格空状态。
5. 检查产品化残留，SettingDrawer / OpenAPI 链接只允许 dev 展示。

NestWeb：
1. 检查 seed 当前菜单和权限码。
2. 检查 Swagger / OpenAPI 覆盖当前前端使用接口。
3. 检查 health / status / version / queues / login-logs / system-logs 权限和文档。
4. 只允许修复 S5 遗留小问题，不新增业务模型。

文档：
1. 更新 handoff 状态。
2. 新增 / 更新页面清单、权限码清单、环境变量、部署流程、运维排障、发布检查清单。
3. 更新两个 README 指向上述文档。

验收：
- NestWeb: lint:check / test -- --runInBand / build 通过。
- Antdpro6: tsc / test -- --runInBand / build / e2e 通过。
- S4 / S6 仍标记为暂停。
```
