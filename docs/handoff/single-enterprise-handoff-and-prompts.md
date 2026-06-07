# TS全栈单企业版企业化完善 Handoff：NestWeb + Antdpro6

> 范围：只做“单企业 / 单组织”企业通用后台，不做多租户，不做 P5，不新增 Tenant / UserTenant / 租户切换。  
> 目标：把当前 NestWeb + Antdpro6 从“单租户企业后台基线”推进到“单企业可交付、可运维、可二开”的通用系统。

---

## 1. 当前状态

当前已完成的核心能力：

- 后端 `Role.code` 已落地，`name` 作为显示名，`code` 作为系统身份。
- 后端基础 RBAC 已有：用户、角色、权限、菜单。
- 前端已经产品化：品牌、manifest、footer、默认首页 `/dashboard`、开发环境才显示 SettingDrawer。
- Dashboard 已经从模板页改成真实工作台。
- Playwright E2E 已覆盖登录、刷新页面、退出、access token 过期 refresh。
- 后端已经有基础安全基线：runtime config 校验、CORS/Swagger 控制、Helmet、metrics 保护、限流、日志脱敏。
- 部署基线已改进：API 启动不再自动跑 migration，Compose 使用独立 migrate 服务。
- 文档基线已改进：README、部署、环境变量、权限模型、安全基线、回滚、E2E 文档已有入口。

当前定位：

```text
已经是“单企业后台基线”，还不是“完整单企业通用系统”。
```

---

## 2. 本轮不要做的事情

明确不做：

```text
- 不做多租户
- 不新增 Tenant / UserTenant / TenantRole
- 不做租户切换器
- 不改 JWT 为 tenant 结构
- 不做跨企业隔离
- 不重做整个 RBAC
- 不引入微服务或复杂中台架构
```

可以做的“单企业组织能力”：

```text
- 公司组织架构 / 部门树
- 岗位 / 职位
- 用户归属部门 / 岗位
- 单企业内的数据归属和基础过滤
```

这不是多租户，是单企业管理后台的基础组织能力。

---

## 3. 当前还差的必备工程能力

### 3.1 后端工程基线

必须补：

1. 强化全局 `ValidationPipe`
   - `forbidNonWhitelisted: true`
   - `transform: true`
   - `enableImplicitConversion: true`
   - `forbidUnknownValues: true`

2. 认证接口 DTO 收口
   - `exchange-code-for-user` 不能继续 `body: any`
   - `miniprogram-login` 不能继续 `body: any`
   - 所有公开认证接口都应使用 DTO + class-validator

3. Prisma 生命周期
   - `PrismaService` 增加 `onModuleInit` / `onModuleDestroy`
   - 明确连接和断开行为，便于优雅退出

4. 异常响应脱敏
   - 不把 Prisma 原始错误直接返回给前端
   - `P2002` 返回业务友好文案
   - 详细错误只写后端日志

5. Readiness 增强
   - 当前建议至少检查：Database、Redis、RabbitMQ、MinIO
   - 队列不可用时要能暴露 readiness 异常

6. DTO 覆盖率
   - 查询参数 DTO 化：分页、排序、筛选
   - 禁止 controller 里散落 `Record<string, any>` 和 `JSON.parse(sorter)` 直接处理

7. 错误码规范
   - 当前响应有 `success/showType/message`
   - 建议增加稳定业务错误码，如 `AUTH_INVALID_CREDENTIALS`、`ROLE_CODE_EXISTS`、`PERMISSION_DENIED`

8. 登录安全增强
   - 登录失败次数记录
   - 用户状态禁用检查
   - 可选：连续失败锁定账号或 IP

9. 用户密码能力
   - 修改密码
   - 重置密码
   - 管理员重置用户密码
   - 密码强度配置

10. OpenAPI 稳定性
   - DTO 加完整 `ApiProperty`
   - 后端 API 变化后前端 service 必须重新生成

---

### 3.2 前端工程基线

必须补：

1. 删除前端记住密码残留
   - `getLoginForm`
   - `setLoginForm`
   - `removeLoginForm`
   - 未使用的 `Encrypt/Decrypt`

2. token 安全路线
   - 短期：保留现状，但文档标记风险
   - 中期：refresh token 迁到 `HttpOnly + Secure + SameSite` Cookie
   - 当前不能再新增“保存密码”类能力

3. Nginx 生产安全头
   - `X-Content-Type-Options`
   - `X-Frame-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`
   - 静态资源缓存策略
   - gzip / body size / timeout

4. 全局错误页
   - 403 无权限页
   - 500 服务异常页
   - 网络异常页
   - 业务空状态组件

5. OpenAPI 类型治理
   - 页面尽量使用生成类型
   - 减少 `any`
   - Dashboard 的 `resolveTotal(any)` 后续改为聚合接口

6. E2E 补充
   - 无权限菜单不展示
   - 登录失败提示
   - 403 页面
   - Dashboard 加载
   - 修改密码后重新登录

---

## 4. 当前还差的必备业务页面

下面按“单企业通用后台”排序，不做多租户。

### 4.1 组织与人员

必须补：

1. 部门管理
   - 部门树
   - 新增 / 编辑 / 删除 / 排序
   - 部门负责人
   - 部门状态
   - 部门下用户数量

2. 岗位管理
   - 岗位编码
   - 岗位名称
   - 岗位排序
   - 岗位状态

3. 用户详情页
   - 基础信息
   - 所属部门
   - 岗位
   - 角色
   - 最近登录
   - 操作记录

4. 个人中心
   - 个人资料
   - 修改头像
   - 修改密码
   - 查看最近登录记录

5. 用户安全操作
   - 禁用 / 启用用户
   - 重置密码
   - 强制退出登录（可后置）

---

### 4.2 系统配置

建议补：

1. 字典管理
   - 字典类型
   - 字典项
   - 启用 / 禁用
   - 排序

2. 参数配置
   - 系统名称
   - 文件大小限制
   - 登录策略
   - 密码策略
   - 是否开放注册

3. 存储配置查看页
   - MinIO / OSS 状态
   - 当前 bucket
   - CDN 地址
   - 只读展示，不直接在页面保存密钥

4. 邮件 / 短信诊断页
   - 当前 provider 状态
   - 测试发送
   - 注意只允许 admin

---

### 4.3 审计与安全

必须补：

1. 登录日志
   - 用户
   - IP
   - 地理位置
   - User-Agent
   - 成功 / 失败
   - 失败原因

2. 操作日志详情页
   - 当前系统日志已有列表基础
   - 需要详情抽屉或详情页
   - 请求信息脱敏展示

3. 在线会话 / Token 管理（可后置）
   - 当前用户活跃 session
   - 管理员强制下线
   - 需要后端 token/session 存储策略支持

4. 安全策略页（可先做只读）
   - 密码长度
   - 登录失败锁定
   - token 有效期
   - CORS/Swagger/metrics 当前状态

---

### 4.4 运维与监控

建议补：

1. 系统状态页
   - API live / ready
   - Database
   - Redis
   - RabbitMQ
   - MinIO
   - 队列长度

2. 队列管理页
   - 系统日志队列
   - IP 地理位置队列
   - 失败任务
   - 重试 / 清理失败任务（仅 admin）

3. 版本信息页
   - Git commit
   - build time
   - Node version
   - API version
   - 前端 build version

4. 备份与恢复文档
   - 页面可以后置
   - 文档必须有：Postgres、MinIO、Redis 是否需要备份

---

### 4.5 文件与资源

已有图片管理，但还可以补：

1. 文件资源中心
   - 图片之外的附件
   - 文件类型
   - 文件大小
   - 上传人
   - 使用场景

2. 上传安全
   - 文件大小限制
   - MIME 检查
   - 扩展名白名单
   - 图片处理失败回滚

3. 资源引用关系（可后置）
   - 哪些业务使用了该文件

---

### 4.6 通知与公告

可作为单企业通用后台补充：

1. 公告管理
   - 标题
   - 内容
   - 发布状态
   - 发布时间

2. 站内通知
   - 发给所有人 / 指定角色 / 指定用户
   - 已读 / 未读

这不是第一优先级，但做完会更像“完整通用系统”。

---

## 5. 推荐一次性完善批次

如果你想“先把 P5 前问题一起解决”，建议分成 5 个 PR 或 5 个连续任务。不要一个超大 PR。

```text
S1：工程基线收口
S2：单企业组织与账号安全
S3：系统配置 / 字典 / 参数
S4：审计 / 运维 / 系统状态
S5：前端体验 / E2E / 文档收口
```

---

## 6. S1：工程基线收口

### NestWeb

- 强化 ValidationPipe
- AuthController DTO 化
- PrismaService 生命周期
- HttpFilter 脱敏
- Readiness 增加 RabbitMQ / MinIO，或明确文档说明
- Dashboard 聚合接口 `GET /api/dashboard/summary`

### Antdpro6

- 删除记住密码残留
- 清理重复依赖
- Nginx 安全头
- Dashboard 改用 `/api/dashboard/summary`

---

## 7. S2：单企业组织与账号安全

### NestWeb

新增模型建议：

```prisma
model Department {
  id        Int      @id @default(autoincrement())
  code      String   @unique
  name      String
  parentId  Int?
  sort      Int      @default(0)
  status    String   @default("enabled")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent    Department?  @relation("DepartmentTree", fields: [parentId], references: [id])
  children  Department[] @relation("DepartmentTree")
  users     User[]
}

model Position {
  id        Int      @id @default(autoincrement())
  code      String   @unique
  name      String
  sort      Int      @default(0)
  status    String   @default("enabled")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
}
```

User 补：

```prisma
departmentId Int?
positionId   Int?
department   Department? @relation(fields: [departmentId], references: [id])
position     Position?   @relation(fields: [positionId], references: [id])
```

> 说明：这是单企业部门/岗位，不是多租户。

账号安全：

- 修改密码接口
- 管理员重置密码接口
- 禁用用户后禁止登录
- 登录日志表

### Antdpro6

新增页面：

- `/organization/departments`
- `/organization/positions`
- `/account/profile`
- 用户详情抽屉 / 页面
- 修改密码弹窗

---

## 8. S3：系统配置 / 字典 / 参数

### NestWeb

新增：

- `DictType`
- `DictItem`
- `SystemConfig`

建议模型：

```prisma
model DictType {
  id        Int      @id @default(autoincrement())
  code      String   @unique
  name      String
  status    String   @default("enabled")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items     DictItem[]
}

model DictItem {
  id         Int      @id @default(autoincrement())
  typeId     Int
  label      String
  value      String
  sort       Int      @default(0)
  status     String   @default("enabled")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  type       DictType @relation(fields: [typeId], references: [id])

  @@unique([typeId, value])
}

model SystemConfig {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Antdpro6

新增页面：

- `/system/dicts`
- `/system/config`

---

## 9. S4：审计 / 运维 / 系统状态

### NestWeb

新增或增强：

- `LoginLog`
- 系统日志详情接口
- 系统状态 summary 接口
- 队列状态接口
- 版本信息接口

接口建议：

```text
GET /api/system/status
GET /api/system/version
GET /api/queue/status
GET /api/login-log/page
GET /api/system-log/:id
```

### Antdpro6

新增页面：

- `/security/login-logs`
- `/system/status`
- `/system/version`
- `/system/queues`

---

## 10. S5：前端体验 / E2E / 文档收口

补齐：

- 403 页面
- 500 页面
- 网络异常页
- 空状态组件
- Dashboard 聚合接口 E2E
- 用户管理 E2E
- 部门管理 E2E
- 修改密码 E2E
- 登录失败 E2E
- 无权限菜单 E2E

文档：

- 单企业部署指南
- 初始化管理员指南
- 备份恢复指南
- 安全配置指南
- 页面清单
- 权限码清单

---

## 11. 一次性总控 Prompt

下面 prompt 适合直接给 Codex / 其他 AI 执行“P5 前单企业完善”。

```text
你正在协助我完善两个仓库：
- Gan-Xing/NestWeb：NestJS + Prisma + PostgreSQL 后端
- Gan-Xing/Antdpro6：Umi Max + Ant Design Pro 前端

目标：只做单企业版企业通用后台完善，不做 P5，不做多租户。

当前已完成：
- Role.code 已完成，Role.name 是显示名，Role.code 是系统身份
- 前端已产品化，默认首页为 /dashboard
- Playwright E2E 已覆盖登录、刷新页面、退出、token refresh
- 安全基线已有：runtime config 校验、CORS/Swagger/metrics、Helmet、限流、日志脱敏
- migration 已从 API 启动拆出
- health/live/ready 已存在

本次目标：补齐 P5 前的单企业必备能力与页面，使系统达到“单企业可交付、可部署、可维护、可二开”的状态。

严格限制：
- 不要新增 Tenant
- 不要新增 UserTenant
- 不要做租户切换
- 不要改 JWT 为多租户结构
- 不要做跨企业隔离
- 不要大规模重构 RBAC
- 不要引入微服务

请按以下 5 个阶段执行，可以分 PR，也可以按阶段提交：

S1 工程基线：
NestWeb：
1. 强化全局 ValidationPipe：whitelist、forbidNonWhitelisted、transform、enableImplicitConversion、forbidUnknownValues。
2. AuthController 中 any body 改 DTO，尤其 exchange-code-for-user 和 miniprogram-login。
3. PrismaService 增加 onModuleInit / onModuleDestroy。
4. HttpFilter 不返回 Prisma 原始错误，P2002 返回业务友好文案。
5. 新增 GET /api/dashboard/summary，聚合 health、用户数、角色数、图片数、最近日志。
6. readiness 增加 RabbitMQ / MinIO 检查，若成本过高先补 TODO 和文档说明。

Antdpro6：
1. 删除前端记住密码残留逻辑：getLoginForm、setLoginForm、removeLoginForm、未使用 Encrypt/Decrypt。
2. 清理重复 @playwright/test。
3. nginx.conf 增加基础安全响应头。
4. Dashboard 改为优先使用 /api/dashboard/summary。

S2 单企业组织与账号安全：
NestWeb：
1. 新增 Department 模型，支持部门树。
2. 新增 Position 模型。
3. User 关联 Department / Position。
4. 新增部门管理 CRUD、岗位管理 CRUD。
5. 用户创建/编辑支持 departmentId / positionId。
6. 新增修改密码接口。
7. 新增管理员重置用户密码接口。
8. 用户 disabled 状态禁止登录。
9. 新增 LoginLog，记录登录成功/失败、IP、UA、失败原因。

Antdpro6：
1. 新增部门管理页面 /organization/departments。
2. 新增岗位管理页面 /organization/positions。
3. 用户管理表单增加部门和岗位。
4. 用户详情抽屉展示部门、岗位、角色、最近登录。
5. 新增个人中心 /account/profile。
6. 新增修改密码弹窗或页面。

S3 系统配置 / 字典：
NestWeb：
1. 新增 DictType / DictItem。
2. 新增 SystemConfig。
3. 新增字典管理接口。
4. 新增系统参数接口。
5. seed 初始化常用字典：用户状态、岗位状态、部门状态、性别、图片分类。

Antdpro6：
1. 新增 /system/dicts 页面。
2. 新增 /system/config 页面。
3. 常用下拉选项优先从字典读取，失败时 fallback 本地枚举。

S4 审计 / 运维：
NestWeb：
1. 增强 system-log 详情接口。
2. 新增 login-log 分页查询接口。
3. 新增 /api/system/status 聚合 DB/Redis/RabbitMQ/MinIO/queue 状态。
4. 新增 /api/system/version 返回 commit、build time、node version、package version。
5. 新增 queue status 接口，展示 Bull 队列 waiting/active/failed/completed。

Antdpro6：
1. 新增 /security/login-logs 页面。
2. 新增 /system/status 页面。
3. 新增 /system/version 页面。
4. 新增 /system/queues 页面。
5. 系统日志页面增加详情抽屉。

S5 前端体验 / E2E / 文档：
Antdpro6：
1. 补 403 页面。
2. 补 500 页面。
3. 补网络异常页或统一 Result 组件。
4. 补空状态组件。
5. E2E 增加：登录失败、无权限菜单、Dashboard summary、部门管理、修改密码。

NestWeb + Antdpro6 文档：
1. 更新 handoff 文档为“单企业版企业化完善”。
2. 更新部署指南。
3. 更新环境变量文档。
4. 新增页面清单。
5. 新增权限码清单。
6. 新增备份恢复说明。

验收命令：
NestWeb：
- pnpm run lint:check
- pnpm test -- --runInBand
- pnpm run build
- pnpm run db:migrate:deploy
- pnpm run db:seed

Antdpro6：
- pnpm run tsc
- pnpm test -- --runInBand
- pnpm run build
- pnpm run e2e

输出要求：
每个阶段完成后输出：
- 修改文件清单
- 数据库 migration 说明
- 是否需要重新生成 OpenAPI
- 新增权限码清单
- 验收命令结果
- 风险点
- 回滚方式
```

---

## 12. 更保守的分阶段 Prompt

如果担心一次性太大，按下面顺序投喂。

### Prompt A：S1 工程基线

```text
请只做 S1 工程基线收口，不做组织、字典、审计新页面。

范围：
NestWeb：ValidationPipe 强化、Auth DTO、PrismaService 生命周期、HttpFilter 脱敏、Dashboard summary 接口、readiness 增强。
Antdpro6：删除记住密码残留、清理重复依赖、Nginx 安全头、Dashboard 改用 summary 接口。

不要做：Department、Position、Dict、LoginLog、多租户。

验收：后端 lint/test/build，前端 tsc/test/build，必要时重新生成 OpenAPI。
```

### Prompt B：S2 组织与账号安全

```text
请只做 S2 单企业组织与账号安全。

范围：
- Department
- Position
- User 关联部门/岗位
- 部门管理页面
- 岗位管理页面
- 用户表单支持部门/岗位
- 用户详情
- 个人中心
- 修改密码
- 管理员重置密码
- 禁用用户禁止登录
- LoginLog

不要做：Tenant、UserTenant、多租户、数据权限。
```

### Prompt C：S3 字典和系统配置

```text
请只做 S3 字典和系统配置。

范围：
- DictType / DictItem
- SystemConfig
- 字典管理页面
- 系统参数页面
- seed 初始化常用字典
- 页面下拉选项优先读取字典

不要做：多租户、工作流、复杂审批。
```

### Prompt D：S4 审计与运维

```text
请只做 S4 审计与运维。

范围：
- 系统日志详情
- 登录日志页面
- 系统状态页
- 版本信息页
- 队列状态页
- 相关后端 API

不要做：多租户、Prometheus/Grafana 深度集成、微服务。
```

### Prompt E：S5 体验与 E2E

```text
请只做 S5 前端体验、E2E 和文档收口。

范围：
- 403 / 500 / 网络异常页
- 空状态组件
- E2E 增加登录失败、无权限菜单、Dashboard summary、部门管理、修改密码
- 文档更新：部署、环境变量、页面清单、权限码清单、备份恢复

不要新增业务模型。
```

---

## 13. 最终单企业版验收清单

完成后，单企业通用后台至少应有这些页面：

```text
/dashboard                         工作台
/auth/users                        用户管理
/auth/roles                        角色管理
/auth/permissions                  权限管理
/auth/menus                        菜单管理
/organization/departments          部门管理
/organization/positions            岗位管理
/account/profile                   个人中心
/system/dicts                      字典管理
/system/config                     系统参数
/system/logs                       操作日志
/security/login-logs               登录日志
/system/status                     系统状态
/system/version                    版本信息
/system/queues                     队列状态
/resources/images                  图片资源
```

后续可选页面：

```text
/system/storage                    存储状态
/system/mail                       邮件诊断
/system/sms                        短信诊断
/resources/files                   文件中心
/notice/announcements              公告管理
/notice/messages                   站内通知
```

---

## 14. 最终判断

不做 P5 的情况下，下一步最有价值的是：

```text
先把单企业后台做完整。
```

优先级：

```text
工程基线 > 部门岗位 > 账号安全 > 字典配置 > 审计运维 > E2E文档
```

完成这些后，这套系统才会从“企业后台基线”变成“单企业通用后台产品”。
