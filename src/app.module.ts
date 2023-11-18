import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  Reflector,
} from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import {
  Config,
  LoggingInterceptor,
  TransformInterceptor,
  HttpFilter,
} from './common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ArticlesModule } from './articles/articles.module';
import { UsersModule } from './users/users.module';
import { PasswordModule } from './password/password.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PermissiongroupsModule } from './permissiongroups/permissiongroups.module';
import { MenusModule } from './menus/menus.module';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ArticlesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [Config],
    }),
    PasswordModule,
    RolesModule,
    PermissionsModule,
    PermissiongroupsModule,
    MenusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () => new ValidationPipe({ whitelist: true }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_FILTER,
      useClass: HttpFilter,
    },
  ],
})
export class AppModule {}
