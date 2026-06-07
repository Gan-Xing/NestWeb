# TS全栈企业化改造 Handoff：NestWeb + Antdpro6

日期：2026-06-07  
目标：把 `NestWeb`（后端）和 `Antdpro6`（前端）从“可运行/可人工验证的后台系统”逐步推进到“企业可以接手、部署、维护、二开”的状态。

---

## 1. 当前共识

### 1.1 关于“测试不完整”的准确表述

之前已经做过：

- 真实接口验证
- 容器部署验证
- 登录接口验证
- 菜单/页面人工检查
- 单元测试
- 构建测试
- CI 基础检查

还没有完整固化的是：

- 自动化 E2E 测试套件
- CI 中自动打开页面、登录、刷新、加载菜单、退出、token refresh、失效跳回登录
- Playwright/Cypress 级别的浏览器真实链路回归

准确表述应为：

> 真实链路人工验证过，但还没有固化成自动化 E2E；下一步要把关键用户链路自动化，作为 CI 的质量门禁。

### 1.2 关于权限模型的范围收口

这轮权限模型只加一个字段：

```prisma
Role.code
```

不要同时加：

```text
Role.isSystem
Role.isProtected
```

原因：

- 当前核心问题是 `Role.name` 同时承担“显示名”和“系统身份”。
- `name` 应该是显示名，可以叫“管理员”“超级管理员”“系统管理员”。
- `code` 才应该是稳定系统标识。
- 用一个字段就能解决核心问题，避免过早引入更多保护字段。

统一规则：

```text
admin 角色：code = "admin"
普通默认角色：code = "user"
保护 admin：判断 role.code === "admin"
默认角色查找：where: { code: "user" }
```

### 1.3 前端产品化优先于 E2E

先做前端模板产品化，再补自动化 E2E。

原因：

- 当前还要移除 `/welcome`、`/admin/sub-page`、默认文案、默认 footer、默认外链。
- 如果先写 E2E，后续路由和首页重构会马上打断测试。
- 正确顺序是：稳定产品化路由和首页 → 再写 E2E。

---

## 2. 当前代码观察

### 2.1 NestWeb

当前后端已经有：

- RBAC 基础模型：Role / Permission / PermissionGroup / User
- 用户、角色、权限、菜单、系统日志、图片、存储、队列、诊断等模块
- 全局 JWT Guard、Permissions Guard、TransformInterceptor、LoggingInterceptor、SystemLogInterceptor、HttpFilter
- OpenAPI 文档生成
- Dockerfile、docker-compose、CI

当前需要重点修正：

- `Role` 当前只有 `name`，没有稳定 `code`。
- 默认角色目前通过 `name: "User"` 查找。
- admin 保护目前通过 `name === "admin"` 判断。
- 角色 DTO / Entity 还没有 `code`。
- Seed 需要从 `upsertRole(name)` 改成 `upsertRole(code, name)`。
- 与角色相关的前端表格、表单、OpenAPI 类型需要同步。

### 2.2 Antdpro6

当前前端已经有：

- Umi Max / Ant Design Pro 基础结构
- OpenAPI 生成 service
- 当前用户加载
- 后端动态菜单
- access 权限控制
- 统一 request/error 处理
- Dockerfile、nginx.conf、CI

当前需要重点产品化：

- `Ant Design Pro` 默认品牌仍存在。
- manifest 名称仍是默认。
- Footer 仍有 Ant Design Pro / GitHub / Ant Design 外链。
- `/welcome` 仍是默认首页。
- `/admin/sub-page` 仍是示例页。
- `/` 当前跳转 `/welcome`。
- `SettingDrawer` 当前会在 layout children 中渲染，应限制为开发环境。
- 右上角问号/文档入口应删除或替换成自有文档入口。
- 登录页要移除模板默认提示和示例账号文案。

---

## 3. 总体路线图

优先级如下：

```text
P1：Role.code 权限模型收口
P2：前端企业化模板产品化
P3：自动化 E2E 测试套件
P4：安全基线和生产部署加固
P5：数据权限、租户、组织架构等更大企业能力
```

本阶段不要做：

```text
- 不要加 isSystem/isProtected
- 不要立即加多租户
- 不要立即重做完整数据权限
- 不要先写 E2E 后改路由
- 不要把前端产品化和安全大改混在一个 PR
```

---

## 4. 阶段 1：Role.code 权限模型收口

### 4.1 改造目标

把角色的系统身份从 `name` 切换到 `code`：

```text
name：显示名，可改，可中文化
code：系统标识，稳定，用于判断 admin/user 等内置角色
```

### 4.2 后端改造清单

#### Prisma schema

`prisma/schema.prisma`

将：

```prisma
model Role {
  id          Int          @id @default(autoincrement())
  name        String       @unique
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  permissions Permission[] @relation("PermissionToRole")
  users       User[]       @relation("UserRoles")
}
```

改成：

```prisma
model Role {
  id          Int          @id @default(autoincrement())
  code        String       @unique
  name        String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  permissions Permission[] @relation("PermissionToRole")
  users       User[]       @relation("UserRoles")

  @@index([name])
}
```

说明：

- `code` 唯一。
- `name` 不再唯一，作为显示名。
- 如果还希望显示名不重复，可以在业务层做提示，但不要把系统身份绑定到 `name`。

#### Migration 策略

推荐迁移步骤：

```sql
ALTER TABLE "Role" ADD COLUMN "code" TEXT;

UPDATE "Role"
SET "code" = CASE
  WHEN lower("name") = 'admin' THEN 'admin'
  WHEN lower("name") = 'user' THEN 'user'
  ELSE lower(regexp_replace("name", '[^a-zA-Z0-9]+', '_', 'g'))
END;

-- 如果历史角色 name 可能转出来重复，要在迁移里处理重复 code，例如追加 _id。
-- 示例思路：
-- UPDATE "Role" SET "code" = "code" || '_' || "id"
-- WHERE "code" IN (SELECT "code" FROM "Role" GROUP BY "code" HAVING count(*) > 1)
-- AND "code" NOT IN ('admin', 'user');

ALTER TABLE "Role" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
CREATE INDEX "Role_name_idx" ON "Role"("name");
```

Prisma migration 可以手工编辑 SQL，保证老数据平滑升级。

#### Seed

`prisma/seed.ts`

把：

```ts
const adminRole = await upsertRole("admin");
const userRole = await upsertRole("User");
```

改成：

```ts
const adminRole = await upsertRole("admin", "系统管理员");
const userRole = await upsertRole("user", "普通用户");
```

把：

```ts
async function upsertRole(name: string) {
  return prisma.role.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}
```

改成：

```ts
async function upsertRole(code: string, name: string) {
  return prisma.role.upsert({
    where: { code },
    create: { code, name },
    update: { name },
  });
}
```

#### UsersService

把默认角色查找从：

```ts
where: { name: "User" }
```

改成：

```ts
where: { code: "user" }
```

影响位置：

- `createUserByWeb`
- `createUserWithUnionId`

把保护当前 admin 的判断从：

```ts
select: { name: true }
role.name === "admin"
where: { name: "admin" }
```

改成：

```ts
select: { code: true }
role.code === "admin"
where: { code: "admin" }
```

#### RolesService

把：

```ts
function assertRoleIsMutable(role?: { name: string } | null) {
  if (role?.name !== "admin") return;
  throw new BadRequestException(...)
}
```

改成：

```ts
function assertRoleIsMutable(role?: { code: string } | null) {
  if (role?.code !== "admin") return;
  throw new BadRequestException(
    "系统管理员角色 admin 由系统维护，不能在后台编辑或删除",
  );
}
```

所有 `select: { name: true }` 用于系统判断的地方改成 `select: { code: true }`。

#### DTO / Entity

`CreateRoleDto` 增加：

```ts
@ApiProperty()
@IsString()
@IsNotEmpty()
@Matches(/^[a-z][a-z0-9._-]*$/)
code: string;
```

`UpdateRoleDto` 建议不要允许修改 `code`。如果为了兼容 UI 暂时允许，需要明确禁止修改 `admin` 角色的 `code`，并给出后端校验。

推荐策略：

```text
创建时填写 code
更新时只允许改 name 和 permissions
code 创建后不可改
```

`RoleEntity` 增加：

```ts
@ApiProperty()
code: string;
```

#### OpenAPI / 前端 service

后端改完后重新生成前端 OpenAPI service：

```bash
cd Antdpro6
pnpm run openapi
```

### 4.3 前端改造清单

角色管理页：

- 列表增加 `code` 列。
- 新增角色表单增加 `code` 输入。
- 编辑角色时 `code` 禁用或不展示。
- admin 角色如果 code 为 `admin`，编辑/删除按钮禁用。
- 不再用 `name === "admin"` 做任何系统判断。

### 4.4 验收标准

必须验证：

1. 老数据库迁移后，每个角色都有唯一 code。
2. admin 角色 `code = "admin"`。
3. 普通默认角色 `code = "user"`。
4. 把 admin 的 `name` 改成“超级管理员”后：
   - 仍然不能删除 admin。
   - 仍然不能把自己从 admin 角色移除。
5. 把 User 的 `name` 改成“普通员工”后：
   - 新注册用户仍能拿到默认 `code = "user"` 角色。
6. 前端角色列表能显示 code。
7. OpenAPI 类型更新正常。
8. 后端测试、构建、lint 通过。
9. 前端 typecheck、build 通过。

---

## 5. 阶段 2：Antdpro6 前端企业化模板产品化

### 5.1 改造目标

把前端从 Ant Design Pro 模板感，改成可交付的企业后台模板。

默认命名：

```text
中文名：企业管理平台
英文名：Enterprise Admin
```

### 5.2 品牌配置

建议新增：

```text
src/config/brand.ts
```

内容：

```ts
export const brand = {
  zhName: '企业管理平台',
  enName: 'Enterprise Admin',
  copyright: '企业管理平台',
  docsUrl: '',
};
```

所有标题、footer、登录页文案尽量从这里取，避免散落硬编码。

### 5.3 替换默认品牌

修改：

```text
config/config.ts
src/manifest.json
src/components/Footer/index.tsx
src/pages/User/Login/*
src/locales/**/*
public 或 src 下的 favicon / icons，如需要
```

替换内容：

```text
Ant Design Pro -> 企业管理平台 / Enterprise Admin
蚂蚁集团体验技术部出品 -> 企业管理平台
Ant Design Pro 外链 -> 删除或换成自有文档
GitHub ant-design-pro 外链 -> 删除
Ant Design 外链 -> 删除或保留为技术说明，不放默认 footer
```

### 5.4 删除演示路由

修改：

```text
config/routes.ts
```

移除：

```text
/welcome
/admin
/admin/sub-page
```

新增：

```text
/dashboard
```

把：

```ts
{
  path: '/',
  redirect: '/welcome',
}
```

改成：

```ts
{
  path: '/',
  redirect: '/dashboard',
}
```

### 5.5 新建真实 Dashboard

新增：

```text
src/pages/Dashboard/index.tsx
```

第一版不要复杂，只做真实企业后台工作台：

```text
- 系统状态
- 快捷入口
- 用户数
- 角色数
- 最近日志
- 资源统计
```

推荐后端增加一个轻量接口：

```text
GET /api/dashboard/summary
```

返回：

```ts
{
  status: 'ok',
  users: { total: number },
  roles: { total: number },
  resources: { images: number },
  logs: { recent: Array<...> }
}
```

如果暂时不想加后端接口，也可以前端先分别调用已有用户、角色、日志、图片列表接口，但长期建议聚合成 dashboard summary，避免首页一进来打很多接口。

### 5.6 Layout 产品化

修改：

```text
src/app.tsx
```

处理：

- `SettingDrawer` 只在开发环境显示。
- `Question` 入口删除，或改成自有文档链接。
- `links` 中只保留自有 OpenAPI 链接，并且仅 dev 显示。
- `layoutBgImgList` 如模板感太强，可以删除或换成自有视觉。
- footer 可保留自定义版权，也可以直接返回 null。

建议：

```tsx
actionsRender: () => [
  isDev && <SelectLang key="SelectLang" />,
].filter(Boolean),
```

`SettingDrawer`：

```tsx
{isDev && (
  <SettingDrawer
    disableUrlParams
    enableDarkTheme
    settings={initialState?.settings}
    onSettingChange={(settings) => {
      setInitialState((preInitialState) => ({
        ...preInitialState,
        settings,
      }));
    }}
  />
)}
```

### 5.7 登录页产品化

目标：

- 保留邮箱 + 密码登录。
- 删除 `admin / ant.design` 之类默认提示。
- 标题改成 `企业管理平台`。
- 副标题改成通用企业后台文案。
- 背景图和图标不要继续使用 Ant Design Pro 默认素材。
- 不在页面上公开默认账号密码。

### 5.8 验收标准

必须验证：

1. 页面标题不再出现 `Ant Design Pro`。
2. manifest 不再出现 `Ant Design Pro`。
3. footer 不再出现 Ant Design Pro / ant-design-pro GitHub 外链。
4. `/` 跳转 `/dashboard`。
5. `/welcome` 不再作为菜单和默认首页。
6. `/admin/sub-page` 示例页移除。
7. Dashboard 能真实加载数据或显示后端健康状态。
8. 生产环境不显示 SettingDrawer。
9. 右上角问号入口删除或替换为自有文档入口。
10. 前端 typecheck、build 通过。

---

## 6. 阶段 3：自动化 E2E 测试套件

### 6.1 工具建议

推荐 Playwright。

原因：

- CI 友好。
- 浏览器安装和 trace 产物成熟。
- 对登录、刷新、跳转、截图、视频、trace 支持好。
- 比 Cypress 更适合未来多浏览器、移动尺寸、并发测试。

### 6.2 测试范围

第一版只覆盖关键链路，不追求大而全：

```text
1. 打开登录页
2. 登录成功
3. 进入 /dashboard
4. 菜单加载
5. 刷新页面后仍保持登录态
6. 退出登录
7. 退出后跳回登录页
8. access token 过期后通过 refresh token 自动续期
9. refresh token 失效后跳回登录页
```

第二版再加：

```text
- 用户列表可打开
- 角色列表可打开
- admin 角色不能删除/编辑
- code=user 默认角色行为正常
- 无权限用户看不到受限菜单
```

### 6.3 建议目录

在前端仓库 `Antdpro6` 增加：

```text
e2e/
  auth.spec.ts
  dashboard.spec.ts
  role.spec.ts
  fixtures/
    users.ts
playwright.config.ts
```

### 6.4 测试环境

推荐本地和 CI 使用相同流程：

```bash
# 后端
cd NestWeb
docker compose up -d postgres redis rabbitmq minio
pnpm install
pnpm prisma migrate deploy
pnpm db:seed
pnpm start:prod 或 pnpm start:dev

# 前端
cd Antdpro6
pnpm install
pnpm run build
pnpm run serve 或使用 nginx/docker
pnpm exec playwright test
```

CI 中建议：

- 后端服务健康检查通过后再启动前端。
- Playwright 失败时上传 trace、screenshot、video。
- E2E 可以先只在 main / release 分支跑，避免开发分支过慢。
- 后续稳定后再加入 PR 必跑。

### 6.5 Playwright 测试建议

登录测试：

```ts
test('login -> dashboard -> refresh -> logout', async ({ page }) => {
  await page.goto('/user/login');
  await page.getByLabel(/邮箱|Email/i).fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel(/密码|Password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: /登录|Login/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/系统状态|Dashboard|工作台/)).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole('button', { name: /退出|Logout/i }).click();
  await expect(page).toHaveURL(/\/user\/login/);
});
```

注意：实际 selector 要以你产品化后的登录页和布局为准，避免写死模板文本。

### 6.6 验收标准

1. 本地可一键跑 E2E。
2. CI 可跑 E2E。
3. 失败有 trace/screenshot。
4. 登录、刷新、菜单、退出链路稳定。
5. 前端路由改造后不再频繁打断 E2E。
6. E2E 账号来自测试 seed 或 CI secret，不在页面公开。

---

## 7. 阶段 4：安全与生产部署加固

这部分不建议和前 3 阶段混在一起，但要进入后续路线。

### 7.1 后端安全基线

优先项：

```text
- 生产环境 JWT secret 缺失即启动失败
- 生产环境 CORS_ORIGINS 缺失即启动失败
- Swagger 生产默认关闭，或加认证/IP 白名单
- /metrics 不裸奔
- Auth public 接口加限流
- 登录失败次数限制
- 验证码接口限流
- refresh token 轮换和复用检测
- HttpFilter 不直接泄露 Prisma 原始错误
- console.log 中不要打印敏感值
```

### 7.2 前端安全基线

优先项：

```text
- 移除记住密码
- refresh token 迁移到 HttpOnly + Secure + SameSite Cookie
- access token 尽量短期内存保存
- token refresh 单飞锁
- 并发请求 refresh 队列
- refresh 成功后重放失败请求
- refresh 失败统一清理并跳登录
```

### 7.3 部署基线

优先项：

```text
- local compose 和 production compose 分离
- migration 从应用启动命令中拆出去
- Nginx 增加 security headers
- 静态资源缓存策略
- gzip/brotli
- readiness/liveness 分离
- Prometheus/Grafana/RabbitMQ/MinIO 管理端口默认不外露
- 备份与恢复文档
```

---

## 8. 推荐分支和 PR 切分

### PR 1：NestWeb Role.code

分支：

```text
feat/role-code
```

内容：

```text
- Prisma Role.code
- migration
- seed 改造
- UsersService 默认角色 code=user
- RolesService admin 保护 code=admin
- DTO/Entity 增加 code
- 单元测试/基础测试
```

不要做：

```text
- 前端产品化
- E2E
- isSystem/isProtected
- 数据权限
```

### PR 2：Antdpro6 role code 适配

分支：

```text
feat/role-code-ui
```

内容：

```text
- 重新生成 OpenAPI
- 角色列表增加 code
- 新增角色表单增加 code
- 编辑角色禁用或隐藏 code
- admin code 的编辑/删除按钮保护
```

### PR 3：Antdpro6 产品化

分支：

```text
feat/productize-admin-template
```

内容：

```text
- 品牌替换
- manifest 替换
- footer 替换
- 删除 /welcome /admin/sub-page
- 新增 /dashboard
- / 跳转 /dashboard
- SettingDrawer 仅 dev
- 登录页产品化
```

### PR 4：NestWeb Dashboard summary

分支：

```text
feat/dashboard-summary
```

内容：

```text
- DashboardModule
- GET /api/dashboard/summary
- 返回系统状态、用户数、角色数、资源统计、最近日志
- 权限 code 使用 dashboard.view
```

如果 PR 3 只想先前端静态 dashboard，可把这个 PR 延后。

### PR 5：Playwright E2E

分支：

```text
test/playwright-e2e
```

内容：

```text
- playwright.config.ts
- e2e/auth.spec.ts
- e2e/dashboard.spec.ts
- CI E2E job
- trace/screenshot artifact
```

---

## 9. 通用 AI/Codex 工作规则 Prompt

以后每一步可以先给 AI 这段总规则，再追加具体任务。

```text
你正在协助我改造两个仓库：
- Gan-Xing/NestWeb：NestJS + Prisma + PostgreSQL 后端
- Gan-Xing/Antdpro6：Umi Max + Ant Design Pro 前端

总目标：把 TS 全栈后台逐步企业化，但每次只做一个小范围 PR，避免范围失控。

工作规则：
1. 不要做超出本次任务范围的重构。
2. 不要引入大而全的新架构。
3. 优先最小可验证改动。
4. 保持现有 pnpm、Node、OpenAPI、Docker、CI 体系。
5. 后端改接口后，要说明前端 OpenAPI 是否需要重新生成。
6. 涉及数据库 schema，必须提供迁移策略和老数据兼容方案。
7. 涉及权限模型，系统身份用 code，不用 name。
8. 本阶段不要新增 isSystem/isProtected。
9. 本阶段不要新增多租户和数据权限，除非任务明确要求。
10. 修改后给出：
   - 修改文件清单
   - 关键设计说明
   - 验收命令
   - 风险点
   - 回滚方式
```

---

## 10. Prompt 1：NestWeb 增加 Role.code

```text
请在 Gan-Xing/NestWeb 中完成 Role.code 权限模型收口。

背景：
当前 Role 只有 name，代码中有多处用 name === "admin" 或 where: { name: "User" } 判断系统身份。现在要把系统身份统一切到 Role.code：
- admin 角色 code = "admin"
- 普通默认角色 code = "user"
- name 只是显示名
- 不要新增 isSystem/isProtected

任务范围：
1. 修改 prisma/schema.prisma：Role 增加 code String @unique，name 改为普通显示名。
2. 生成/编辑 Prisma migration，确保老数据平滑迁移：
   - 原 name=admin -> code=admin
   - 原 name=User/user -> code=user
   - 其他角色生成稳定 code，如从 name slug 化，冲突时加 id 后缀
3. 修改 prisma/seed.ts：
   - upsertRole(code, name)
   - admin 用 code=admin
   - 默认用户角色用 code=user
4. 修改 UsersService：
   - 默认角色查找从 name=User 改为 code=user
   - 保护当前 admin 的判断从 role.name === "admin" 改为 role.code === "admin"
   - adminRole 查找从 where: { name: "admin" } 改为 where: { code: "admin" }
5. 修改 RolesService：
   - assertRoleIsMutable 使用 code 判断 admin
   - 用于保护判断的 select 从 name 改为 code
6. 修改 Role DTO / Entity：
   - CreateRoleDto 增加 code，校验格式 /^[a-z][a-z0-9._-]*$/
   - RoleEntity 增加 code
   - UpdateRoleDto 不允许修改 code，或者明确禁止修改 admin code；优先不允许修改 code
7. 更新相关测试或新增最小测试：
   - admin name 改成中文后，code=admin 仍受保护
   - 默认角色 name 改成中文后，code=user 仍被注册流程使用

不要做：
- 不要新增 isSystem/isProtected
- 不要新增租户/数据权限
- 不要改前端页面
- 不要大规模重构 RBAC

完成后输出：
- 修改文件列表
- migration 说明
- 验收命令
- 是否需要前端重新生成 OpenAPI
```

---

## 11. Prompt 2：Antdpro6 适配 Role.code

```text
请在 Gan-Xing/Antdpro6 中适配后端 Role.code。

背景：
后端 Role 已增加 code 字段，name 只作为显示名。前端角色管理页面需要展示和创建 code，但编辑时不应修改 code。admin 判断必须使用 role.code === "admin"，不能用 role.name。

任务范围：
1. 重新生成 OpenAPI service：
   pnpm run openapi
2. 找到角色管理页面：
   - 列表增加 code 列
   - 新增角色表单增加 code 输入
   - code 校验 /^[a-z][a-z0-9._-]*$/
   - 编辑角色时 code 禁用或不展示
3. 所有 admin 角色保护逻辑改为 role.code === "admin"。
4. admin 角色删除/编辑按钮禁用，提示“系统管理员角色由系统维护”。
5. 如果存在基于 name 判断 User/admin 的逻辑，全部改成 code。

不要做：
- 不要做前端品牌产品化
- 不要改路由
- 不要写 E2E
- 不要引入 isSystem/isProtected

完成后输出：
- 修改文件列表
- 页面行为说明
- 验收命令：pnpm run tsc、pnpm run build
- 需要人工检查的页面路径
```

---

## 12. Prompt 3：Antdpro6 企业化模板产品化

```text
请在 Gan-Xing/Antdpro6 中进行企业化模板产品化改造。

目标：
把前端从 Ant Design Pro 默认模板，改成通用企业后台模板。
暂定名称：
- 中文：企业管理平台
- 英文：Enterprise Admin

任务范围：
1. 新增 src/config/brand.ts，集中定义品牌名、版权、文档链接。
2. 替换默认品牌：
   - config/config.ts title
   - src/manifest.json name/short_name
   - Footer 文案和外链
   - 登录页标题/副标题/默认文案
   - locales 中明显的 Ant Design Pro 文案
3. 删除演示路由：
   - 移除 /welcome
   - 移除 /admin/sub-page
   - 移除 /admin 示例菜单
4. 新增真实 /dashboard 页面：
   - 系统状态
   - 快捷入口
   - 用户数
   - 角色数
   - 最近日志
   - 资源统计
   如果后端没有 dashboard summary 接口，先用清晰的空状态/占位结构，并保留 TODO 注释。
5. 修改 / 跳转到 /dashboard。
6. Layout 产品化：
   - SettingDrawer 只在 development 显示
   - 右上角 Question/文档入口删除或改成自有文档入口
   - footer 改成自有版权或移除
7. 登录页产品化：
   - 移除 admin / ant.design 示例提示
   - 保留邮箱密码登录
   - 不在页面公开默认账号密码

不要做：
- 不要写 E2E
- 不要改后端权限模型
- 不要改 token 存储方案
- 不要引入新的 UI 框架

完成后输出：
- 修改文件列表
- 删除/新增路由说明
- 人工验收清单
- 验收命令：pnpm run tsc、pnpm run build
```

---

## 13. Prompt 4：NestWeb Dashboard Summary 接口

```text
请在 Gan-Xing/NestWeb 中新增 Dashboard summary 接口，为 Antdpro6 /dashboard 提供真实数据。

目标接口：
GET /api/dashboard/summary

权限：
使用现有 dashboard.view 权限 code。不要新增复杂权限模型。

返回建议：
{
  "status": "ok",
  "users": { "total": number },
  "roles": { "total": number },
  "resources": { "images": number },
  "logs": {
    "recent": [
      {
        "id": number,
        "username": string,
        "requestUrl": string,
        "method": string,
        "status": number,
        "createdAt": string
      }
    ]
  }
}

任务范围：
1. 新增 DashboardModule / DashboardController / DashboardService。
2. 从 Prisma 统计用户数、角色数、图片数。
3. 查询最近系统日志，限制 5 条。
4. 接口加 ApiTags、ApiOkResponse。
5. 接口加 Permissions，使用 dashboard.view。
6. OpenAPI 可生成前端 service。

不要做：
- 不要改系统日志模型
- 不要新增多租户
- 不要做复杂图表统计
- 不要改前端

完成后输出：
- 修改文件列表
- 接口返回示例
- 验收命令
- 提醒前端执行 pnpm run openapi
```

---

## 14. Prompt 5：Playwright E2E

```text
请在 Gan-Xing/Antdpro6 中新增 Playwright 自动化 E2E 测试套件。

前提：
前端已经产品化，默认首页是 /dashboard，不再是 /welcome。
后端 NestWeb 可以在本地或 CI 中启动，测试账号来自 seed 或环境变量。

任务范围：
1. 安装并配置 Playwright。
2. 新增 playwright.config.ts。
3. 新增 e2e/auth.spec.ts，覆盖：
   - 打开 /user/login
   - 邮箱密码登录
   - 跳转 /dashboard
   - 刷新页面仍保持登录
   - 菜单可见
   - 退出登录
   - 回到 /user/login
4. 新增 e2e/session.spec.ts，覆盖：
   - access token 过期后 refresh 成功
   - refresh token 失效后清理登录态并跳回登录页
   如果当前前端 token refresh 逻辑不支持稳定测试，先把测试标记为 test.fixme，并说明需要先修 token refresh 单飞锁。
5. CI 增加可选 E2E job：
   - 上传 trace/screenshot artifact
   - 先允许手动触发或 main 分支跑
6. 测试账号使用环境变量：
   - E2E_ADMIN_EMAIL
   - E2E_ADMIN_PASSWORD

不要做：
- 不要改路由
- 不要做前端产品化
- 不要大改 request/token 逻辑，除非测试无法启动时只做最小修复
- 不要把 E2E 写成依赖 Ant Design Pro 默认文案

完成后输出：
- 新增文件列表
- 本地运行命令
- CI 运行方式
- 哪些测试是稳定的，哪些是 fixme
```

---

## 15. Prompt 6：安全基线后续任务

```text
请在 Gan-Xing/NestWeb 和 Gan-Xing/Antdpro6 中做企业安全基线梳理，但先只输出方案，不直接改代码。

需要检查：
NestWeb：
- JWT secret 是否允许默认值
- CORS 生产环境是否开放
- Swagger 是否生产裸露
- /metrics 是否裸露
- Auth public 接口是否有限流
- 登录失败是否有限制
- refresh token 是否有轮换和复用检测
- HttpFilter 是否泄露内部错误
- console.log 是否打印敏感信息

Antdpro6：
- access token / refresh token 存储方式
- 是否记住密码
- token refresh 是否有并发锁
- refresh 成功是否重放失败请求
- refresh 失败是否清理并跳登录
- 生产环境是否显示 SettingDrawer 或默认外链

输出：
1. 风险列表
2. 优先级 P0/P1/P2
3. 每项影响范围
4. 每项推荐修复方式
5. 建议 PR 切分
6. 不要直接修改代码
```

---

## 16. 最终企业化 Definition of Done

当下面这些完成后，可以说项目进入“企业可试点交付”状态：

### 后端

- Role.code 完成，name 不再承担系统身份。
- JWT/CORS/Swagger/metrics 生产环境安全默认。
- Auth public 接口有限流。
- 健康检查区分 liveness/readiness。
- Prisma migration 不在多副本应用启动中并发执行。
- Dashboard summary 有真实接口。
- 关键 RBAC 流程有测试。
- OpenAPI 可稳定生成。

### 前端

- Ant Design Pro 模板痕迹清理。
- 默认首页是 `/dashboard`。
- 登录页产品化。
- Layout 产品化。
- Role.code UI 适配完成。
- request/token 行为稳定。
- Playwright E2E 覆盖登录、刷新、菜单、退出。
- CI 能跑 typecheck、build、test、E2E。

### 文档

- README 不再是模板。
- 有部署文档。
- 有环境变量文档。
- 有权限模型文档。
- 有 E2E 运行文档。
- 有安全基线说明。
- 有回滚说明。

---

## 17. 下一步建议

最小行动顺序：

```text
1. NestWeb：feat/role-code
2. Antdpro6：feat/role-code-ui
3. Antdpro6：feat/productize-admin-template
4. NestWeb：feat/dashboard-summary
5. Antdpro6：test/playwright-e2e
6. 双仓库：security-baseline-plan
```

每一步做完都先跑：

```bash
pnpm install
pnpm run build
pnpm run lint 或 pnpm run tsc
pnpm test
```

涉及 OpenAPI 的后端变更后，前端再跑：

```bash
pnpm run openapi
pnpm run tsc
pnpm run build
```
