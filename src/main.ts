import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express"; // ✅ 确保使用 Express
import helmet from "helmet";
import { AppModule } from "./app.module";
import { setupOpenApi } from "./openapi";
import {
  buildCorsOrigin,
  shouldSetupOpenApi,
  validateRuntimeConfig,
} from "./common/configs/runtime-config";

async function bootstrap() {
  validateRuntimeConfig();

  const app = await NestFactory.create<NestExpressApplication>(AppModule); // ✅ 明确指定 Express

  const openApiEnabled = shouldSetupOpenApi();
  app.disable("x-powered-by");
  app.use(
    helmet(openApiEnabled ? { contentSecurityPolicy: false } : undefined),
  );
  app.set("query parser", "extended");
  const corsOrigin = buildCorsOrigin();
  if (corsOrigin !== false) {
    app.enableCors({
      origin: corsOrigin,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    });
  }
  app.set("trust proxy", true);

  if (openApiEnabled) {
    setupOpenApi(app);
  }
  await app.listen(Number(process.env.PORT) || 3030);
}

bootstrap();
