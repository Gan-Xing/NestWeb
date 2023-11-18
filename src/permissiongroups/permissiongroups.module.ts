import { Module } from '@nestjs/common';
import { PermissiongroupsService } from './permissiongroups.service';
import { PermissiongroupsController } from './permissiongroups.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // 其他需要的模块...
  ],
  controllers: [PermissiongroupsController],
  providers: [PermissiongroupsService],
})
export class PermissiongroupsModule {}
