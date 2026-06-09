# Message Center Integration

更新时间：2026-06-09

消息中心提供通知和待办两类协同基础能力。业务模块通过 `businessType + businessId` 关联自己的业务记录。

## 能力边界

- `NOTIFICATION`：通知，可标记已读。
- `TODO`：待办，可完成或取消。
- 消息中心不负责业务状态流转。
- 业务模块需要自行维护自己的业务状态。

## 后端接入方式

在业务 Service 中注入 `MessagesService`：

```ts
await messagesService.createNotification({
  userId,
  title: "业务通知标题",
  content: "业务通知内容",
  category: MessageCategory.SYSTEM,
  link: "/your-module/path",
  businessType: "your_module",
  businessId: String(entity.id),
  createdById: currentUserId,
});
```

创建待办：

```ts
await messagesService.createTodo({
  userId: assigneeId,
  title: "待办标题",
  content: "待办说明",
  category: MessageCategory.TASK,
  link: "/your-module/path",
  businessType: "your_module",
  businessId: String(entity.id),
  createdById: currentUserId,
});
```

完成或取消业务待办：

```ts
await messagesService.completeBusinessTodos(
  "your_module",
  String(entity.id),
  assigneeId,
);
await messagesService.cancelBusinessTodos(
  "your_module",
  String(entity.id),
  assigneeId,
);
```

## 权限

- 查看个人消息：`message.view`
- 管理全部消息：`message.manage`
- 完成或取消待办：`message.complete`

## 测试建议

- 普通用户只能查看自己的消息。
- 拥有 `message.manage` 或 admin 可以查看全部消息。
- 待办只能由归属用户操作。
- 通知只能标记已读，待办只能完成或取消。
