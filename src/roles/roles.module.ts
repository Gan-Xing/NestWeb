import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // 其他需要的模块...
  ],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
