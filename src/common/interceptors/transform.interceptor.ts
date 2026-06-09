// transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { I18nService } from "nestjs-i18n";

type ContextType = "http" | "rmq" | "rpc" | "ws" | "graphql";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  private readonly logger = new Logger(TransformInterceptor.name);

  constructor(private readonly i18n: I18nService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const contextType = context.getType<ContextType>();

    // 根据不同的上下文类型进行处理
    switch (contextType) {
      case "http":
        return this.handleHttpResponse(context, next);
      case "rmq":
      case "rpc":
      case "ws":
      case "graphql":
        this.logger.debug(
          `Skipping response transform for ${contextType} context`,
        );
        return next.handle();
      default:
        this.logger.warn(
          `Unknown context type: ${contextType}, skipping response transform`,
        );
        return next.handle();
    }
  }

  private handleHttpResponse(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    if (request?.path === "/metrics") {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url,
        message: this.translate("common.operation_success", request),
        data,
        success: true,
        showType: 0,
      })),
    );
  }

  private translate(key: string, request: any): string {
    return this.i18n.translate(key, {
      lang: this.resolveLanguage(request),
    });
  }

  private resolveLanguage(request: any): "zh" | "en" {
    const queryLang = request?.query?.lang;
    const customLang = request?.headers?.["x-custom-lang"];
    const acceptLanguage = request?.headers?.["accept-language"];
    const raw = String(
      queryLang || customLang || acceptLanguage || "",
    ).toLowerCase();

    return raw.startsWith("en") ? "en" : "zh";
  }
}

export interface Response<T> {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  data: T;
  success: boolean;
  showType: number;
}
