# TS 全栈单企业后台 S8 Handoff：消息中心 + 审批基础预留 + 表格导出

日期：2026-06-09
适用仓库：

- `Gan-Xing/NestWeb`：NestJS + Prisma + PostgreSQL 后端
- `Gan-Xing/Antdpro6`：Umi Max + Ant Design Pro 前端

## 0. 当前阶段定位

当前路线已经不再优先推进：

- S4：知识库 MVP
- S6：AI 知识助手 / RAG / 向量检索

这两个方向继续暂停，后续作为专项重新研究。

当前目标是把系统从“单企业通用后台基础版”继续补成更像企业内部系统的可复用底座。  
本阶段不做具体业务系统，也不做复杂审批流，只补最通用的协同能力和导出能力。

### 0.1 当前实现状态

截至 2026-06-09，本阶段已按 S8 范围完成：

- NestWeb：新增 `Message`、`ApprovalRequest`、`ApprovalAction` 模型、migration、消息接口、单步审批接口、seed 菜单和权限码。
- Antdpro6：新增 `/message-center`、`/approvals/requests` 页面，补齐 access、路由、菜单图标、service typings。
- 表格导出：主要管理表已加入前端当前页 CSV 导出，使用 `export.data` 控制展示。
- OpenAPI：NestWeb 已支持源码生成 `docs/openapi/nestweb.openapi.json`，Antdpro6 默认从该固定契约生成 `src/services/nest-web`。
- CI：NestWeb 已增加 `pnpm run openapi:check`，Antdpro6 已增加 `pnpm run openapi:nest:check`。
- E2E：已覆盖审批创建、生成待办、消息 CSV 导出、审批通过、审批 CSV 导出。

本阶段仍明确不包含：

- 知识库、AI、RAG、向量检索、多租户、部门岗位、公告、导入、BPMN、流程设计器、复杂审批流。

### 0.2 当前验收结果

已通过：

- NestWeb：`pnpm run lint:check`
- NestWeb：`pnpm test -- --runInBand`
- NestWeb：`pnpm run build`
- NestWeb：`docker compose up -d --build api`
- NestWeb：`docker compose run --rm --no-deps api pnpm run db:seed`
- Antdpro6：`pnpm run tsc`
- Antdpro6：`pnpm test -- --runInBand`
- Antdpro6：`pnpm run build`
- Antdpro6：`pnpm run e2e`
- Antdpro6：`docker compose up -d --build frontend`
- NestWeb：`pnpm run openapi:check`
- Antdpro6：`pnpm run openapi:nest:check`

已落地：

- `20260608182500_s8_messages_approval_lite` migration 已由 `nestweb-migrate` 容器成功应用。
- seed 已在 Docker 网络内执行，菜单和权限码已写入数据库。
- 运行态巡检已确认 `/api/messages`、`/api/approval-requests` 返回 200，用户菜单包含 `message.center` 和 `approval.requests`。

后续边界：

- OpenAPI 已自动生成，但必须以 NestWeb 源码生成的固定契约为准，不从旧运行环境的 `/openapi.json` 拉取。
- S8 审批仍是 Approval Lite，不包含 BPMN、流程设计器、多级审批、会签、条件分支或具体请假 / 报销业务。

## 1. 本阶段最终确认新增内容

本阶段统一命名为：

```text
S8：消息中心 + 审批基础预留 + 表格导出
```

新增三类能力：

```text
1. 消息中心
   - 通知和待办合一
   - 一个统一入口承载通知、待办、系统提醒、审批提醒

2. 审批基础预留
   - 不是完整审批流
   - 不做流程模板
   - 不做流程设计器
   - 只提供任意业务页面以后可以接入审批的最小通用结构

3. 表格导出
   - 给已有主要表格增加导出能力
   - 先做前端轻量导出
   - 不做导入
   - 不做后端大批量导出任务
```

## 2. 明确不做什么

本阶段严禁做：

```text
- 不做知识库
- 不新增 KnowledgeSpace / KnowledgeDocument / KnowledgeTag / KnowledgeAttachment
- 不做 AI / RAG / 向量检索 / 文档分块
- 不做多租户
- 不新增 Tenant / UserTenant
- 不做 Department / Position
- 不做公告
- 不做导入
- 不做 BPMN
- 不做流程设计器
- 不做复杂条件审批
- 不做请假 / 加班 / 报销等具体业务页面
- 不重构 RBAC
```

## 3. 深度设计判断

### 3.1 为什么通知和待办应该合一

企业后台里，“通知”和“待办”本质都是发给某个用户的信息，只是行为不同：

```text
通知：提醒用户知道某件事
待办：提醒用户处理某件事
```

如果拆成两个模块，会产生重复字段和重复页面：

```text
Notification.title
TodoTask.title

Notification.userId
TodoTask.assigneeId

Notification.link
TodoTask.link

Notification.readAt
TodoTask.completedAt
```

所以本阶段建议统一为：

```text
Message
```

通过 `type` 区分：

```text
notification
todo
```

通过时间字段表达状态：

```text
readAt       通知是否已读
completedAt 待办是否完成
cancelledAt 待办是否取消
```

这样前端只需要一个入口：

```text
/message-center
```

页面内部用 Tabs：

```text
待办
通知
已处理
```

### 3.2 为什么审批只做基础预留

用户当前不是要做完整审批系统，而是希望以后任何页面能快速接审批。

因此本阶段不要设计：

```text
ApprovalDefinition
ApprovalDefinitionNode
流程模板
流程节点
流程设计器
会签/或签
条件分支
部门负责人审批
```

只做最小的：

```text
ApprovalRequest
ApprovalAction
```

它解决的问题是：

```text
任意业务页面创建一个审批请求
审批请求可以关联 businessType + businessId
审批人可以是指定用户或指定角色
审批人可以通过 / 驳回 / 取消
审批动作有历史记录
审批会生成待办和通知
```

这样未来请假、加班、报销、文件审批、付款申请都可以接入，但现在不需要提前实现这些业务。

### 3.3 为什么表格导出先做前端导出

导出是企业后台很常见的能力，但真正企业级全量导出会涉及：

```text
权限
筛选条件
大数据量
异步任务
导出记录
文件过期
安全审计
```

当前阶段不需要做重。  
先做轻量前端导出：

```text
导出当前页
导出当前筛选结果
导出选中行
```

格式优先：

```text
CSV UTF-8 BOM
```

如果项目已经愿意新增依赖，也可以封装成 XLSX，但本阶段不强制。

## 4. 后端设计：Message

### 4.1 Prisma 模型建议

```prisma
enum MessageType {
  NOTIFICATION
  TODO
}

enum MessageCategory {
  SYSTEM
  SECURITY
  APPROVAL
  TASK
  CUSTOM
}

model Message {
  id           Int             @id @default(autoincrement())
  userId       Int
  title        String
  content      String?
  type         MessageType
  category     MessageCategory @default(SYSTEM)
  link         String?
  businessType String?
  businessId   String?

  readAt       DateTime?
  completedAt  DateTime?
  cancelledAt  DateTime?

  createdById  Int?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  user         User            @relation("UserMessages", fields: [userId], references: [id], onDelete: Cascade)
  createdBy    User?           @relation("MessageCreator", fields: [createdById], references: [id], onDelete: SetNull)

  @@index([userId, type, createdAt])
  @@index([userId, readAt])
  @@index([userId, completedAt])
  @@index([businessType, businessId])
}
```

说明：

- `Message.userId` 始终指向具体用户。
- 如果要发给角色，不在模型里保存 role target，而是在服务层 fan-out 给当前拥有该角色的用户。
- 这样查询“我的消息”非常简单，避免运行时动态角色匹配导致权限不稳定。
- 后续如需要“角色待办池”，再扩展 `MessageTarget`，本阶段不做。

### 4.2 消息状态规则

```text
type = NOTIFICATION:
  readAt == null     未读
  readAt != null     已读

type = TODO:
  completedAt == null && cancelledAt == null   待办
  completedAt != null                           已完成
  cancelledAt != null                           已取消
```

不要再额外维护一个容易冲突的 `status` 字段，除非前端确实需要冗余显示。

### 4.3 后端接口

```text
GET  /api/messages
POST /api/messages/:id/read
POST /api/messages/read-all
POST /api/messages/:id/complete
POST /api/messages/:id/cancel
GET  /api/messages/unread-count
```

查询参数建议：

```text
type=notification|todo
state=unread|read|pending|done|cancelled
category=system|security|approval|task|custom
keyword=
page=
pageSize=
```

### 4.4 权限规则

```text
message.view
  当前用户查看自己的消息

message.manage
  管理员查看全部消息，或后续用于系统消息管理

message.complete
  当前用户完成自己的 todo
```

约束：

- 普通用户只能操作自己的消息。
- `message.manage` 可以查看全部，但是否能完成别人待办需要谨慎，本阶段不建议允许。
- 系统创建消息应通过 service，而不是让普通用户直接 POST 创建任意消息。

### 4.5 MessageService 建议封装

建议提供内部方法：

```ts
createNotification(input);
createTodo(input);
createTodoForRole(roleCode, input);
markRead(messageId, currentUser);
markAllRead(currentUser);
completeTodo(messageId, currentUser);
cancelTodo(messageId, currentUser);
```

角色待办 fan-out 逻辑：

```text
createTodoForRole("finance", input)
  -> 查询拥有 finance 角色的 active 用户
  -> 为每个用户创建一条 Message(type=TODO)
```

## 5. 后端设计：Approval Lite

### 5.1 Prisma 模型建议

```prisma
enum ApprovalRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum ApprovalActionType {
  SUBMIT
  APPROVE
  REJECT
  CANCEL
  COMMENT
}

enum ApprovalApproverType {
  USER
  ROLE
}

model ApprovalRequest {
  id               Int                   @id @default(autoincrement())
  title            String
  description      String?
  businessType     String
  businessId       String?
  payload          Json?

  applicantId      Int
  approverType     ApprovalApproverType
  approverUserId   Int?
  approverRoleCode String?

  status           ApprovalRequestStatus @default(PENDING)
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt
  decidedAt        DateTime?

  applicant        User                  @relation("ApprovalApplicant", fields: [applicantId], references: [id], onDelete: Restrict)
  approverUser     User?                 @relation("ApprovalApproverUser", fields: [approverUserId], references: [id], onDelete: SetNull)
  actions          ApprovalAction[]

  @@index([businessType, businessId])
  @@index([applicantId, createdAt])
  @@index([status, createdAt])
  @@index([approverUserId, status])
  @@index([approverRoleCode, status])
}

model ApprovalAction {
  id          Int                @id @default(autoincrement())
  requestId   Int
  actorId     Int
  action      ApprovalActionType
  comment     String?
  createdAt   DateTime           @default(now())

  request     ApprovalRequest    @relation(fields: [requestId], references: [id], onDelete: Cascade)
  actor       User               @relation("ApprovalActionActor", fields: [actorId], references: [id], onDelete: Restrict)

  @@index([requestId, createdAt])
  @@index([actorId, createdAt])
}
```

### 5.2 设计约束

本阶段审批是“单步审批预留”，不是流程引擎。

支持：

```text
一个申请人
一个审批目标
审批目标是用户或角色
通过
驳回
取消
评论
审批历史
待办联动
通知联动
```

不支持：

```text
多节点
会签
或签
加签
转交
撤回到任意节点
动态表单
条件分支
流程定义
```

### 5.3 审批业务规则

创建审批：

```text
POST /api/approval-requests
```

创建时：

```text
1. 创建 ApprovalRequest(status=PENDING)
2. 写入 ApprovalAction(action=SUBMIT)
3. 如果 approverType=USER：
   给 approverUserId 创建 TODO Message
4. 如果 approverType=ROLE：
   给拥有 approverRoleCode 的 active 用户 fan-out 创建 TODO Message
```

审批通过：

```text
POST /api/approval-requests/:id/approve
```

通过时：

```text
1. 校验当前用户是否是 approverUser 或拥有 approverRoleCode
2. ApprovalRequest.status = APPROVED
3. decidedAt = now
4. 写 ApprovalAction(APPROVE)
5. 完成当前用户相关 TODO
6. 给申请人创建 NOTIFICATION
```

审批驳回：

```text
POST /api/approval-requests/:id/reject
```

驳回时：

```text
1. 校验审批权限
2. status = REJECTED
3. 写 ApprovalAction(REJECT)
4. 完成或取消相关 TODO
5. 给申请人创建 NOTIFICATION
```

取消：

```text
POST /api/approval-requests/:id/cancel
```

取消规则：

```text
申请人可以取消自己的 PENDING 审批
approval.requests.cancel 权限可取消任意 PENDING 审批
```

### 5.4 接口清单

```text
GET  /api/approval-requests
POST /api/approval-requests
GET  /api/approval-requests/:id
POST /api/approval-requests/:id/approve
POST /api/approval-requests/:id/reject
POST /api/approval-requests/:id/cancel
POST /api/approval-requests/:id/comment
```

查询参数：

```text
status=
businessType=
applicantId=
approverRoleCode=
mine=true
pendingForMe=true
page=
pageSize=
```

### 5.5 权限码

```text
approval.requests.view
approval.requests.create
approval.requests.approve
approval.requests.reject
approval.requests.cancel
approval.requests.manage
```

说明：

- `approval.requests.create`：创建审批请求。
- `approval.requests.view`：查看自己相关审批。
- `approval.requests.manage`：查看全部审批。
- `approve/reject` 还要叠加审批人身份判断，不是有权限码就能批所有。
- `cancel` 默认申请人可取消自己的 PENDING；管理员可取消全部。

## 6. 前端设计：消息中心

### 6.1 页面

```text
/message-center
```

建议 Tabs：

```text
待办
通知
已处理
```

### 6.2 页面功能

待办 Tab：

```text
- 展示 type=TODO 且未完成未取消
- 标题
- 内容
- 分类
- 创建时间
- 业务链接 link
- 完成按钮
```

通知 Tab：

```text
- 展示 type=NOTIFICATION
- 未读高亮
- 标记已读
- 全部已读
- 点击跳转 link
```

已处理 Tab：

```text
- completedAt != null 或 cancelledAt != null
- 展示完成/取消时间
```

### 6.3 顶部入口

可以在右上角加一个简单消息入口：

```text
铃铛图标 + unread-count
```

如果 UI 成本高，第一版可以只放菜单，不做顶部 badge。

## 7. 前端设计：审批请求中心

### 7.1 页面

```text
/approvals/requests
```

### 7.2 功能

```text
- 审批请求列表
- 创建基础审批请求
- 审批详情抽屉
- 审批历史
- 通过
- 驳回
- 取消
```

### 7.3 创建表单字段

```text
title
description
businessType
businessId
approverType
approverUserId
approverRoleCode
payload Json 可选，不建议第一版暴露复杂编辑
```

### 7.4 展示字段

```text
标题
业务类型
业务 ID
申请人
审批人 / 审批角色
状态
创建时间
决定时间
操作
```

## 8. 表格导出设计

### 8.1 目标页面

优先覆盖当前已有主要表格：

```text
用户管理
角色管理
操作日志
登录日志
系统配置
字典管理
文件列表
消息中心
审批请求
```

如果某些页面不存在或尚未完成，不强行新增业务页面，只在存在的页面加导出按钮。

### 8.2 导出策略

第一版建议：

```text
前端 CSV 导出
导出当前页或当前已加载数据
支持选中行导出
UTF-8 BOM，保证 Excel 打开中文不乱码
```

不做：

```text
后端异步全量导出任务
导出记录
导出文件过期
导入
```

### 8.3 前端工具建议

新增：

```text
src/utils/exportCsv.ts
src/components/TableExportButton
```

工具函数：

```ts
exportRowsToCsv({
  filename,
  columns,
  rows,
});
```

`columns` 只接受：

```text
title
dataIndex
renderText?
```

防止把 ReactNode 直接导出成 `[object Object]`。

### 8.4 权限

统一权限码：

```text
export.data
```

是否每个页面都判断 `export.data`，可以按当前 access 体系处理。  
如果页面已有查看权限，也可以允许导出当前页，但企业安全更推荐独立权限。

## 9. 菜单建议

新增菜单：

```text
/workbench
  /message-center      消息中心

/approvals
  /approvals/requests  审批请求
```

也可以不加 `/workbench` 父级，直接：

```text
/message-center
/approvals/requests
```

更简洁。  
推荐第一版用简洁路径：

```text
/message-center
/approvals/requests
```

## 10. Seed 建议

### 10.1 权限码

```text
message.view
message.manage
message.complete

approval.requests.view
approval.requests.create
approval.requests.approve
approval.requests.reject
approval.requests.cancel
approval.requests.manage

export.data
```

### 10.2 默认角色建议

`admin`：

```text
全部权限
```

`user` / `viewer`：

```text
message.view
message.complete
approval.requests.view
approval.requests.create
```

具体是否给普通用户审批权限，需要看当前系统默认角色策略。  
如果不确定，普通用户只给：

```text
message.view
message.complete
approval.requests.view
approval.requests.create
```

不要给：

```text
approval.requests.approve
approval.requests.reject
approval.requests.manage
export.data
```

## 11. OpenAPI

后端新增接口后，必须先从 NestWeb 源码生成固定契约：

```bash
cd NestWeb
pnpm run openapi:generate
pnpm run openapi:check
```

然后在 Antdpro6 从该固定契约生成客户端：

```bash
cd Antdpro6
pnpm run openapi:nest
pnpm run openapi:nest:check
```

默认读取：

```text
../NestWeb/docs/openapi/nestweb.openapi.json
```

不要默认从运行环境的 `/openapi.json` 拉取 schema，除非本次任务明确要验证某个指定环境的接口契约。

## 12. E2E 建议

本阶段最小 E2E 覆盖：

```text
1. 管理员登录
2. 打开 /message-center
3. 页面正常加载
4. 打开 /approvals/requests
5. 创建一个基础审批请求
6. 审批请求出现在列表
7. 审批待办出现在消息中心
8. 导出消息当前页 CSV
9. 审批通过
10. 导出审批当前页 CSV
```

当前 Antdpro6 `e2e/s8.spec.ts` 已覆盖上述链路。运行生产类环境 E2E 时使用专用测试账号，不使用 bootstrap 管理员账号。

## 13. 文档更新

更新 handoff：

```text
docs/handoff/ts-fullstack-single-enterprise-handoff-v2.md
docs/handoff/ts-fullstack-s8-message-approval-export-handoff.md
docs/handoff/README.md
```

新增或更新：

```text
docs/pages.md
docs/permissions.md
docs/release-checklist.md
```

需要标记：

```text
S4 知识库：暂停
S6 AI：暂停
S8 消息中心 + 审批预留 + 表格导出：已完成
```

## 14. 分 PR 建议

不要一次性做完所有内容。建议拆成 3 个 PR：

```text
PR1：Message Center 后端 + 前端
PR2：Approval Lite 后端 + 前端
PR3：Table Export + E2E + 文档
PR4：OpenAPI 源码契约生成 + CI 漂移检查
```

如果让 AI 一次性做，也必须要求它保持边界，不要越界做知识库、AI、流程引擎。

## 15. 验收命令

NestWeb：

```bash
pnpm run openapi:check
pnpm run lint:check
pnpm test -- --runInBand
pnpm run build
```

Antdpro6：

```bash
pnpm run openapi:nest:check
pnpm run tsc
pnpm test -- --runInBand
pnpm run build
pnpm run e2e
```

`pnpm run e2e` 需要 `E2E_BASE_URL`、`E2E_ADMIN_EMAIL`、`E2E_ADMIN_PASSWORD` 指向可写的非生产验收环境。

## 16. 风险点

### 16.1 Message 状态混乱

风险：

```text
notification 和 todo 用同一个表，状态容易混乱。
```

规避：

```text
不要用一个 status 字段塞所有语义。
使用 readAt / completedAt / cancelledAt。
type 决定语义。
```

### 16.2 角色审批 fan-out

风险：

```text
approverRoleCode 对应多人，审批待办创建给谁？
```

本阶段策略：

```text
创建给当前拥有该角色的所有 active 用户。
任意一个有审批资格的人审批后，请求完成。
其他人的待办标记为 cancelled 或 done。
```

### 16.3 审批和业务状态不同步

风险：

```text
审批通过了，但业务表不知道怎么处理。
```

本阶段定位：

```text
Approval Lite 只做审批记录和状态，不自动改业务表。
未来具体业务页面自己处理 businessType + businessId 的状态联动。
```

### 16.4 导出数据范围

风险：

```text
用户以为导出全部，其实只导出当前页。
```

规避：

```text
按钮文案明确：导出当前页 / 导出选中行。
不要叫“导出全部”。
```

## 17. 回滚方式

```text
1. 数据库回滚：
   - 回滚 Message / ApprovalRequest / ApprovalAction migration
   - 或保留表但隐藏菜单和权限

2. 前端回滚：
   - 移除 /message-center 和 /approvals/requests 路由
   - 移除菜单 seed
   - 移除导出按钮

3. 权限回滚：
   - 从 seed 中移除 message.* / approval.requests.* / export.data
   - 重新运行 seed

4. OpenAPI 回滚：
   - 还原生成的 service 文件
```

## 18. 给 AI 的精炼开发 Prompt

```text
只执行 S8：消息中心 + 审批基础预留 + 表格导出。

当前状态：
S1/S2/S3/S5/S7 已完成。S4 知识库和 S6 AI 暂停，严禁触碰。

目标：
补齐单企业通用后台的轻量协同能力：通知/待办合一、单步审批预留、已有表格导出。不要做完整审批流，不要做具体请假/加班业务。

严格禁止：
- 不做知识库，不新增 Knowledge*
- 不做 AI/RAG/向量检索
- 不做多租户，不新增 Tenant/UserTenant
- 不做 Department/Position
- 不做公告
- 不做导入
- 不做 BPMN/流程设计器/复杂审批流
- 不做请假/加班/报销等具体业务页面
- 不重构 RBAC

NestWeb：
1. 新增 Message 模型：
   - userId、title、content、type、category、link、businessType、businessId
   - readAt、completedAt、cancelledAt
   - createdById、createdAt、updatedAt
   - type: NOTIFICATION / TODO
   - category: SYSTEM / SECURITY / APPROVAL / TASK / CUSTOM
2. 新增消息接口：
   - GET /api/messages
   - POST /api/messages/:id/read
   - POST /api/messages/read-all
   - POST /api/messages/:id/complete
   - POST /api/messages/:id/cancel
   - GET /api/messages/unread-count
3. 当前用户只能看自己的消息；message.manage 可查看全部。
4. 新增 ApprovalRequest / ApprovalAction：
   - 单步审批
   - 支持 businessType + businessId
   - 支持 approverUserId 或 approverRoleCode
   - 状态：PENDING / APPROVED / REJECTED / CANCELLED
   - 动作：SUBMIT / APPROVE / REJECT / CANCEL / COMMENT
5. 新增审批接口：
   - GET /api/approval-requests
   - POST /api/approval-requests
   - GET /api/approval-requests/:id
   - POST /api/approval-requests/:id/approve
   - POST /api/approval-requests/:id/reject
   - POST /api/approval-requests/:id/cancel
   - POST /api/approval-requests/:id/comment
6. 审批创建时创建 TODO Message；通过/驳回/取消时更新待办，并通知申请人。
7. seed 新增权限码：
   - message.view
   - message.manage
   - message.complete
   - approval.requests.view
   - approval.requests.create
   - approval.requests.approve
   - approval.requests.reject
   - approval.requests.cancel
   - approval.requests.manage
   - export.data

Antdpro6：
1. 新增 /message-center：
   - Tabs：待办 / 通知 / 已处理
   - 支持标记已读、全部已读、完成待办、跳转 link
2. 新增 /approvals/requests：
   - 审批请求列表
   - 创建基础审批请求
   - 详情抽屉
   - 支持通过、驳回、取消、评论
   - 不做审批模板和流程设计器
3. 已有主要表格增加导出按钮：
   - 用户管理
   - 角色管理
   - 操作日志
   - 登录日志
   - 系统配置
   - 字典
   - 文件列表
   - 消息中心
   - 审批请求
4. 导出优先做前端 CSV，文案明确为“导出当前页/导出选中行”，不要做全量导出任务。
5. 同步菜单、access 权限、OpenAPI service。

验收：
NestWeb:
- pnpm run lint:check
- pnpm test -- --runInBand
- pnpm run build

Antdpro6:
- pnpm run tsc
- pnpm test -- --runInBand
- pnpm run build

完成后输出：
- 修改文件清单
- migration 说明
- 新增权限码
- seed 变化
- OpenAPI 是否重新生成
- 表格导出覆盖页面
- 验收结果
- 风险点
- 回滚方式
```
