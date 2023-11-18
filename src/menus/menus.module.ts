import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { PermissiongroupsModule } from 'src/permissiongroups/permissiongroups.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [PrismaModule, PermissiongroupsModule, UsersModule],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
