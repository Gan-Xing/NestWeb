import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("NestWeb Enterprise API")
    .setDescription("Enterprise admin backend API contract for Antdpro6.")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "access-token",
    )
    .build();

  return SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
}

export function setupOpenApi(app: INestApplication) {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "openapi.json",
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
