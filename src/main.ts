import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express"; // ✅ 确保使用 Express
import { AppModule } from "./app.module";
import { setupOpenApi } from "./openapi";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // ✅ 明确指定 Express

  app.set("query parser", "extended");
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  app.set("trust proxy", true);
  // 在应用启动前检查 DATABASE_URL 环境变量
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL is not set.");
    process.exit(1); // 退出代码 1 表示错误
  } else {
    console.log("DATABASE_URL is set.");
  }

  setupOpenApi(app);
  await app.listen(Number(process.env.PORT) || 3030);
}

bootstrap();
