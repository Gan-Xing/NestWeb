import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Module, Provider, Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AccountController } from "src/account/account.controller";
import { AppController } from "src/app.controller";
import { ApprovalRequestsController } from "src/approval-requests/approval-requests.controller";
import { ArticlesController } from "src/articles/articles.controller";
import { AuthController } from "src/auth/auth.controller";
import { CaptchaController } from "src/captcha/captcha.controller";
import { DashboardController } from "src/dashboard/dashboard.controller";
import { DiagnosticsController } from "src/diagnostics/diagnostics.controller";
import { DictsController } from "src/dicts/dicts.controller";
import { FilesController } from "src/files/files.controller";
import { ImagesController } from "src/images/images.controller";
import { LoginLogsController } from "src/login-logs/login-logs.controller";
import { MenusController } from "src/menus/menus.controller";
import { MessagesController } from "src/messages/messages.controller";
import { PermissiongroupsController } from "src/permissiongroups/permissiongroups.controller";
import { PermissionsController } from "src/permissions/permissions.controller";
import { RolesController } from "src/roles/roles.controller";
import { SystemConfigController } from "src/system-config/system-config.controller";
import { SystemLogController } from "src/system-log/system-log.controller";
import { SystemController } from "src/system/system.controller";
import { UsersController } from "src/users/users.controller";

import { UsersService } from "src/users/users.service";
import { AppService } from "src/app.service";
import { ApprovalRequestsService } from "src/approval-requests/approval-requests.service";
import { ArticlesService } from "src/articles/articles.service";
import { AuthService } from "src/auth/auth.service";
import { CaptchaService } from "src/captcha/captcha.service";
import { DashboardService } from "src/dashboard/dashboard.service";
import { DiagnosticsService } from "src/diagnostics/diagnostics.service";
import { DictsService } from "src/dicts/dicts.service";
import { FilesService } from "src/files/files.service";
import { ImagesService } from "src/images/images.service";
import { LoginLogsService } from "src/login-logs/login-logs.service";
import { MenusService } from "src/menus/menus.service";
import { MessagesService } from "src/messages/messages.service";
import { PermissiongroupsService } from "src/permissiongroups/permissiongroups.service";
import { PermissionsService } from "src/permissions/permissions.service";
import { RolesService } from "src/roles/roles.service";
import { SystemConfigService } from "src/system-config/system-config.service";
import { SystemLogService } from "src/system-log/system-log.service";
import { SystemService } from "src/system/system.service";
import { createOpenApiDocument } from "src/openapi";

const defaultOutputPath = "docs/openapi/nestweb.openapi.json";
const noopService = new Proxy(
  {},
  {
    get: (_target, property) => {
      if (property === "then") {
        return undefined;
      }

      return () => undefined;
    },
  },
);

function serviceStub(token: Type<unknown> | string): Provider {
  return {
    provide: token,
    useValue: noopService,
  };
}

@Module({
  controllers: [
    AccountController,
    AppController,
    ApprovalRequestsController,
    ArticlesController,
    AuthController,
    CaptchaController,
    DashboardController,
    DiagnosticsController,
    DictsController,
    FilesController,
    ImagesController,
    LoginLogsController,
    MenusController,
    MessagesController,
    PermissiongroupsController,
    PermissionsController,
    RolesController,
    SystemConfigController,
    SystemLogController,
    SystemController,
    UsersController,
  ],
  providers: [
    serviceStub(UsersService),
    serviceStub(AppService),
    serviceStub(ApprovalRequestsService),
    serviceStub(ArticlesService),
    serviceStub(AuthService),
    serviceStub(CaptchaService),
    serviceStub(DashboardService),
    serviceStub(DiagnosticsService),
    serviceStub(DictsService),
    serviceStub(FilesService),
    serviceStub(ImagesService),
    serviceStub("IStorageService"),
    serviceStub(LoginLogsService),
    serviceStub(MenusService),
    serviceStub(MessagesService),
    serviceStub(PermissiongroupsService),
    serviceStub(PermissionsService),
    serviceStub(RolesService),
    serviceStub(SystemConfigService),
    serviceStub(SystemLogService),
    serviceStub(SystemService),
  ],
})
class OpenApiSpecModule {}

async function main() {
  const outputPath = resolve(process.env.OPENAPI_OUTPUT_PATH ?? defaultOutputPath);
  const app = await withTimeout(
    NestFactory.create<NestExpressApplication>(OpenApiSpecModule, {
      abortOnError: false,
      logger: ["error", "warn"],
    }),
    30_000,
    "Timed out while creating the OpenAPI spec application.",
  );

  try {
    const document = createOpenApiDocument(app);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    process.stdout.write(`OpenAPI schema generated: ${outputPath}\n`);
  } finally {
    await app.close();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => {
      rejectPromise(new Error(message));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolvePromise(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        rejectPromise(error);
      });
  });
}

main().catch((error: unknown) => {
  process.stderr.write(
    error instanceof Error ? `${error.stack ?? error.message}\n` : `${String(error)}\n`,
  );
  process.exitCode = 1;
});
