import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtConfig, SecurityConfig } from 'src/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PasswordModule } from 'src/password/password.module';
import { PasswordService } from 'src/password/password.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    PasswordModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const securityConfig = configService.get<SecurityConfig>('security');
        const jwtConfig = configService.get<JwtConfig>('jwt');
        return {
          secret: jwtConfig.accessSecret,
          signOptions: {
            expiresIn: securityConfig.expiresIn, // e.g. 30s, 7d, 24h
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordService],
  exports: [AuthService, PasswordService], // 导出 PasswordService
})
export class AuthModule {}
