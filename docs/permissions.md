# 权限码清单

权限码由 `prisma/seed.ts` 维护。系统身份使用 `Role.code`，显示名使用 `Role.name`。

## 系统角色

| Role.code         | 显示名       | 说明                              |
| ----------------- | ------------ | --------------------------------- |
| `admin`           | 系统管理员   | 拥有全部系统权限，受保护          |
| `user`            | 普通用户     | 默认注册 / 创建用户能力包         |
| `manager`         | 业务负责人   | 预置业务负责人能力包              |
| `operator`        | 运营人员     | 预置运营能力包                    |
| `finance`         | 财务人员     | 预置财务能力包                    |
| `viewer`          | 只读观察员   | 基础查看能力                      |
| `knowledge_admin` | 知识库管理员 | S4 预留角色，当前不启用知识库功能 |

## 页面与操作权限

| 模块     | 权限码                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 工作台   | `dashboard.view`                                                                                                                                                      |
| 消息中心 | `message.view`, `message.manage`, `message.complete`                                                                                                                  |
| 用户管理 | `auth.users.view`, `auth.users.create`, `auth.users.update`, `auth.users.delete`, `auth.users.disable`, `auth.users.resetPassword`                                    |
| 角色管理 | `auth.roles.view`, `auth.roles.create`, `auth.roles.update`, `auth.roles.delete`                                                                                      |
| 权限管理 | `auth.permissions.view`, `auth.permissions.create`, `auth.permissions.update`, `auth.permissions.delete`                                                              |
| 菜单管理 | `auth.menus.view`, `auth.menus.create`, `auth.menus.update`, `auth.menus.delete`                                                                                      |
| 图片资源 | `resources.images.view`, `resources.images.create`, `resources.images.upload`, `resources.images.update`, `resources.images.delete`                                   |
| 操作日志 | `system.logs.view`, `system.logs.detail`, `system.logs.export`, `system.logs.delete`                                                                                  |
| 字典管理 | `system.dicts.view`, `system.dicts.create`, `system.dicts.update`, `system.dicts.delete`                                                                              |
| 系统参数 | `system.config.view`, `system.config.update`                                                                                                                          |
| 文件中心 | `system.files.view`, `system.files.upload`, `system.files.download`, `system.files.delete`                                                                            |
| 系统状态 | `system.status.view`                                                                                                                                                  |
| 版本信息 | `system.version.view`                                                                                                                                                 |
| 队列状态 | `system.queues.view`                                                                                                                                                  |
| 登录日志 | `security.loginLogs.view`                                                                                                                                             |
| 审批请求 | `approval.requests.view`, `approval.requests.create`, `approval.requests.approve`, `approval.requests.reject`, `approval.requests.cancel`, `approval.requests.manage` |
| 个人中心 | `account.profile.view`, `account.profile.update`, `account.password.change`                                                                                           |
| 通用导出 | `export.data`                                                                                                                                                         |

## 内置保护

- `admin` 角色按 `Role.code = "admin"` 判断，不依赖显示名。
- 系统内置菜单和权限由 seed 维护，后台不应该编辑或删除。
- 前端 `access.ts` 只负责展示控制，最终接口权限以后端 guard 为准。
- 新增页面时必须同步：后端权限码、seed 菜单、前端路由、前端 access、OpenAPI client、本文档。
