import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissiongroupsService } from './permissiongroups.service';
import { CreatePermissionGroupDto, UpdatePermissionGroupDto } from './dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common';
import { PermissionEntity } from 'src/permissions/entities';

@Controller('api/permissiongroups')
@ApiTags('permissiongroups')
export class PermissiongroupsController {
  constructor(
    private readonly permissiongroupsService: PermissiongroupsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'POST', path: '/menus' }))
  create(@Body() createPermissiongroupDto: CreatePermissionGroupDto) {
    return this.permissiongroupsService.create(createPermissiongroupDto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'GET', path: '/menus' }))
  findAll() {
    return this.permissiongroupsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'GET', path: '/menus' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissiongroupsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'PATCH', path: '/menus' }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissiongroupDto: UpdatePermissionGroupDto,
  ) {
    return this.permissiongroupsService.update(id, updatePermissiongroupDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/menus' }))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissiongroupsService.remove(id);
  }
}
