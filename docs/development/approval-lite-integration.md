# Approval Lite Integration

更新时间：2026-06-09

Approval Lite 是单步审批请求能力，用于给业务模块提供最小审批闭环。

## 明确边界

- 它不是完整审批流。
- 它没有流程模板。
- 它没有节点流转。
- 它没有 BPMN / 流程设计器。
- 它只提供单步审批请求。
- 审批人可以是指定用户或指定角色。
- 审批结果需要业务模块自行响应或查询。

## 关联业务

业务模块使用：

```text
businessType = 业务模块稳定编码
businessId   = 业务记录主键或稳定业务号
```

示例：

```json
{
  "title": "采购申请审批",
  "businessType": "purchase_request",
  "businessId": "PR-2026-001",
  "approverType": "USER",
  "approverUserId": 12
}
```

## 审批状态

- `PENDING`：待审批
- `APPROVED`：已通过
- `REJECTED`：已驳回
- `CANCELLED`：已取消

## 当前联动

- 创建审批请求会生成审批待办。
- 通过 / 驳回会完成审批人的待办，并通知申请人。
- 取消会取消待办，并通知申请人。
- 已处理审批不能重复处理。
- 非审批人不能通过或驳回。

## 业务模块如何响应审批结果

当前推荐两种方式：

1. 业务页面查询 `/api/approval-requests`，根据 `businessType + businessId` 展示审批状态。
2. 业务 Service 在执行关键动作前查询审批请求状态，决定是否允许继续。

不要在 S9 阶段引入流程引擎或复杂回调系统。
