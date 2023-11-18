import { Configs } from './config.interface';

const Config: Configs = {
  isProd: process.env.NODE_ENV === 'production',
  nest: {
    port: parseInt(process.env.PORT) || 3000,
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    title: process.env.SWAGGER_TITLE || 'Nestjs FTW',
    description:
      process.env.SWAGGER_DESCRIPTION || 'The nestjs API description',
    version: process.env.SWAGGER_VERSION || '1.5',
    path: process.env.SWAGGER_PATH || 'api',
  },
  security: {
    expiresIn: process.env.SECURITY_EXPIRES_IN || '1d',
    refreshIn: process.env.SECURITY_REFRESH_IN || '7d',
    bcryptSaltOrRound: parseInt(process.env.SECURITY_BCRYPT_SALT) || 10,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'defaultAccessSecret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret',
  },
};

export default (): Configs => Config;
