# OpenAPI Workflow

更新时间：2026-06-09

OpenAPI 契约必须从 NestWeb 源码生成，前端再从固定 JSON 生成 client。

## 后端

```bash
pnpm run openapi:generate
pnpm run openapi:check
```

输出文件：

```text
docs/openapi/nestweb.openapi.json
```

`openapi:check` 会在生成后检查该文件是否存在未提交 diff。

## 前端

在 Antdpro6 中：

```bash
pnpm run openapi:nest
pnpm run openapi:nest:check
```

默认读取：

```text
../NestWeb/docs/openapi/nestweb.openapi.json
```

不要默认从正在运行的旧服务拉 schema，避免旧接口覆盖新 client。

## 什么时候必须重新生成

- Controller 路径变化。
- DTO 字段变化。
- Entity 响应结构变化。
- 新增、删除或重命名接口。
- Swagger decorator 变化影响前端生成类型。

## 提交规则

后端接口变化应包含：

- NestWeb 源码变化
- `docs/openapi/nestweb.openapi.json`
- Antdpro6 `src/services/nest-web` 生成结果
- 对应前端调用修复
- 必要测试
