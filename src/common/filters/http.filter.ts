import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { I18nService } from "nestjs-i18n";

const knownMessageKeys = new Map<string, string>([
  ["Not authenticated", "common.not_authenticated"],
  ["Unauthorized", "common.not_authenticated"],
  ["Insufficient permissions", "common.insufficient_permissions"],
  ["Metrics endpoint is protected", "common.metrics_protected"],
  ["Admin privileges are required", "common.admin_required"],
  ["只有通知可以标记已读", "common.messages.notification_only_read"],
  ["只有待办可以完成", "common.messages.todo_only_complete"],
  ["待办已取消", "common.messages.todo_cancelled"],
  ["只有待办可以取消", "common.messages.todo_only_cancel"],
  ["待办已完成", "common.messages.todo_completed"],
  ["没有查看全部消息的权限", "common.messages.view_all_forbidden"],
  ["消息不存在", "common.messages.not_found"],
  ["不能操作其他用户的消息", "common.messages.other_user_forbidden"],
  ["只能取消待审批请求", "common.approvals.only_pending_cancel"],
  ["没有取消该审批请求的权限", "common.approvals.cancel_forbidden"],
  ["审批请求已处理", "common.approvals.already_processed"],
  ["审批请求不存在", "common.approvals.not_found"],
  ["请选择审批用户", "common.approvals.select_user"],
  ["请选择审批角色", "common.approvals.select_role"],
  ["审批用户不存在或已停用", "common.approvals.user_invalid"],
  ["审批角色不存在或已停用", "common.approvals.role_invalid"],
  ["没有查看该审批请求的权限", "common.approvals.view_forbidden"],
  ["当前用户不是该审批请求的审批人", "common.approvals.approver_forbidden"],
  ["未找到上传的文件", "common.files.upload_required"],
  ["文件大小超过限制", "common.files.size_limit"],
  ["文件不存在", "common.files.not_found"],
  ["文件存储对象删除失败", "common.files.storage_delete_failed"],
  ["图片不存在", "common.images.not_found"],
  ["无权访问此图片", "common.images.view_forbidden"],
  ["无权更新此图片", "common.images.update_forbidden"],
  ["无权删除此图片", "common.images.delete_forbidden"],
  ["不支持的文件类型", "common.images.unsupported_type"],
  ["系统参数不存在", "common.system_config.not_found"],
  ["该系统参数不可编辑", "common.system_config.not_editable"],
  ["字典类型不存在", "common.dicts.type_not_found"],
  ["字典类型不存在或已停用", "common.dicts.type_not_found_or_disabled"],
  ["字典项不存在", "common.dicts.item_not_found"],
  ["字典类型编码不存在", "common.dicts.type_code_not_found"],
  ["登录日志不存在", "common.login_logs.not_found"],
  ["Email already in use", "common.users.email_exists"],
  ["Phone number already in use", "common.users.phone_exists"],
  ["Default role does not exist", "common.users.default_role_missing"],
  ["Invalid pagination parameters", "common.users.invalid_pagination"],
  ["不能禁用或离职当前登录用户", "common.users.cannot_disable_self"],
  ["当前用户没有可验证的密码", "common.users.password_missing"],
  ["当前密码不正确", "common.users.current_password_invalid"],
  [
    "不能移除自己当前使用的 admin 管理员角色",
    "common.users.cannot_remove_own_admin",
  ],
  ["部分角色不存在", "common.users.roles_missing"],
  ["不能分配已停用的角色", "common.users.roles_disabled"],
  ["不能删除当前登录用户", "common.users.cannot_delete_self"],
  ["Email and password are required", "common.auth.email_password_required"],
  ["Invalid credentials", "common.auth.invalid_credentials"],
  ["User is disabled", "common.auth.user_disabled"],
  ["Invalid password", "common.auth.invalid_password"],
  ["Invalid email verification code", "common.auth.invalid_email_code"],
  ["Refresh token reuse detected", "common.auth.refresh_token_reused"],
  ["User not found", "common.permissions.user_not_found"],
  ["Permission not found", "common.permissions.permission_not_found"],
  ["Some permissions do not exist", "common.roles.permissions_missing"],
  [
    "系统管理员角色 admin 由系统维护，不能在后台编辑或删除",
    "common.roles.admin_locked",
  ],
]);

@Catch()
export class HttpFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const contextType = host.getType();

    if (contextType === "http") {
      return this.handleHttpException(exception, host);
    } else if (contextType === "rpc") {
      return this.handleRpcException(exception, host);
    } else {
      this.logger.error(
        `Unhandled exception in ${contextType} context:`,
        exception,
      );
      throw exception;
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const lang = this.resolveLanguage(request);
    let message = this.translate("common.internal_server_error", lang);
    if (exception instanceof HttpException) {
      message = this.resolveHttpExceptionMessage(exception, lang);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error("Prisma known request error", {
        code: exception.code,
        meta: exception.meta,
        message: exception.message,
      });
      switch (exception.code) {
        case "P2002": {
          status = HttpStatus.CONFLICT;
          message = this.translate("common.unique_conflict", lang);
          break;
        }
        default:
          message = this.translate("common.database_operation_failed", lang);
          break;
      }
    } else if (exception instanceof Error && exception.message) {
      this.logger.error("Unhandled application error", {
        message: exception.message,
        stack: exception.stack,
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      data: null,
      success: false,
      showType: 2,
    });
  }

  private resolveHttpExceptionMessage(
    exception: HttpException,
    lang: "zh" | "en",
  ): string {
    const exceptionResponse = exception.getResponse();
    const rawMessage =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : this.extractResponseMessage(exceptionResponse);

    if (!rawMessage) {
      return this.translate("common.internal_server_error", lang);
    }

    return this.translateKnownMessage(rawMessage, lang);
  }

  private extractResponseMessage(response: unknown): string {
    if (!response || typeof response !== "object") {
      return "";
    }

    const maybeMessage = (response as { message?: unknown }).message;
    if (Array.isArray(maybeMessage)) {
      return maybeMessage.join("; ");
    }
    if (typeof maybeMessage === "string") {
      return maybeMessage;
    }

    return "";
  }

  private translateKnownMessage(message: string, lang: "zh" | "en"): string {
    const key = knownMessageKeys.get(message);
    if (key) {
      return this.translate(key, lang);
    }

    const systemManagedMenuMatch = message.match(
      /^系统内置菜单「(.+)」由代码种子维护，不能在后台(编辑|删除)$/,
    );
    if (systemManagedMenuMatch) {
      const operation = systemManagedMenuMatch[2] === "编辑" ? "编辑" : "删除";
      return this.translateSystemManagedMessage(
        "common.system_managed.menu_locked",
        systemManagedMenuMatch[1],
        operation,
        lang,
      );
    }

    const systemManagedPermissionMatch = message.match(
      /^系统内置权限「(.+)」由代码种子维护，不能在后台(编辑|删除)$/,
    );
    if (systemManagedPermissionMatch) {
      const operation =
        systemManagedPermissionMatch[2] === "编辑" ? "编辑" : "删除";
      return this.translateSystemManagedMessage(
        "common.system_managed.permission_locked",
        systemManagedPermissionMatch[1],
        operation,
        lang,
      );
    }

    return message;
  }

  private translateSystemManagedMessage(
    key: string,
    name: string,
    operation: "编辑" | "删除",
    lang: "zh" | "en",
  ): string {
    const operationKey =
      operation === "编辑"
        ? "common.system_managed.operation.edit"
        : "common.system_managed.operation.delete";

    return this.translate(key, lang, {
      name,
      operation: this.translate(operationKey, lang),
    });
  }

  private translate(
    key: string,
    lang: "zh" | "en",
    args?: Record<string, unknown>,
  ): string {
    return this.i18n.translate(key, { lang, args });
  }

  private resolveLanguage(request: Request): "zh" | "en" {
    const queryLang = request.query?.lang;
    const customLang = request.headers["x-custom-lang"];
    const acceptLanguage = request.headers["accept-language"];
    const raw = String(
      queryLang || customLang || acceptLanguage || "",
    ).toLowerCase();

    return raw.startsWith("en") ? "en" : "zh";
  }

  private handleRpcException(exception: unknown, _host: ArgumentsHost) {
    this.logger.error("RPC Exception:", {
      error: exception instanceof Error ? exception.message : "Unknown error",
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // 对于RPC上下文，我们只记录错误并重新抛出
    throw exception;
  }
}
