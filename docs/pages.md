# 页面清单

本清单对应当前单企业通用后台基础版。S4 知识库和 S6 AI 知识助手继续暂停，当前交付不包含知识库、AI、多租户、部门和岗位页面。

## Antdpro6 页面

| 路由                   | 页面         | 权限                      | 状态   |
| ---------------------- | ------------ | ------------------------- | ------ |
| `/user/login`          | 登录 / 注册  | 公共页面                  | 已完成 |
| `/dashboard`           | 工作台       | 登录可见，数据按权限展示  | 已完成 |
| `/message-center`      | 消息中心     | `message.view`            | 已完成 |
| `/auth/users`          | 用户管理     | `auth.users.view`         | 已完成 |
| `/auth/roles`          | 角色能力包   | `auth.roles.view`         | 已完成 |
| `/auth/permissions`    | 权限管理     | `auth.permissions.view`   | 已完成 |
| `/auth/menus`          | 菜单管理     | `auth.menus.view`         | 已完成 |
| `/resources/images`    | 图片资源     | `resources.images.view`   | 已完成 |
| `/system/logs`         | 操作日志     | `system.logs.view`        | 已完成 |
| `/system/dicts`        | 字典管理     | `system.dicts.view`       | 已完成 |
| `/system/config`       | 系统参数     | `system.config.view`      | 已完成 |
| `/system/files`        | 文件中心     | `system.files.view`       | 已完成 |
| `/system/status`       | 系统状态     | `system.status.view`      | 已完成 |
| `/system/version`      | 版本信息     | `system.version.view`     | 已完成 |
| `/system/queues`       | 队列状态     | `system.queues.view`      | 已完成 |
| `/security/login-logs` | 登录日志     | `security.loginLogs.view` | 已完成 |
| `/approvals/requests`  | 审批请求     | `approval.requests.view`  | 已完成 |
| `/account/profile`     | 个人中心     | `account.profile.view`    | 已完成 |
| `/403`                 | 无权限页面   | 路由权限失败时展示        | 已完成 |
| `/500`                 | 服务异常页面 | 手动访问或异常兜底        | 已完成 |
| `*`                    | 404 页面     | 公共兜底                  | 已完成 |

## 暂停页面

| 路由                        | 原计划      | 当前状态        |
| --------------------------- | ----------- | --------------- |
| `/knowledge/*`              | 知识库 MVP  | S4 暂停，不实现 |
| `/knowledge/assistant`      | AI 知识助手 | S6 暂停，不实现 |
| `/organization/departments` | 部门管理    | 未来可选扩展    |
| `/organization/positions`   | 岗位管理    | 未来可选扩展    |
| `/tenant/*`                 | 多租户      | 不在当前路线    |

## 交付约束

- 当前后台按单企业部署，不提供租户切换。
- `Role` 是岗位 / 职责 / 能力包，当前不新增 `Position`。
- 组织树、部门审批、部门数据隔离出现真实需求前，不新增 `Department`。
- 前端菜单由后端 `PermissionGroup` seed 和当前用户角色权限共同决定。
- S8 已加入消息中心、审批请求和主要表格当前页 CSV 导出，不包含复杂审批流、导入和后端异步导出任务。
