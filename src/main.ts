import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function setupSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.setTitle('Median')
		.setDescription('The Median API description')
		.setVersion('0.1')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true
	});
	// 在应用启动前检查 DATABASE_URL 环境变量
	if (!process.env.DATABASE_URL) {
		console.error('Error: DATABASE_URL is not set.');
		process.exit(1); // 退出代码 1 表示错误
	} else {
		console.log('DATABASE_URL is set.');
	}

	setupSwagger(app);

	await app.listen(3030);
}

bootstrap();
