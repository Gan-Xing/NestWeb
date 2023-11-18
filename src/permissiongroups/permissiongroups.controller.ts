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

@Controller('api/permissiongroups')
@ApiTags('permissiongroups')
export class PermissiongroupsController {
  constructor(
    private readonly permissiongroupsService: PermissiongroupsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  create(@Body() createPermissiongroupDto: CreatePermissionGroupDto) {
    return this.permissiongroupsService.create(createPermissiongroupDto);
  }

  @Get()
  @ApiBearerAuth()
  findAll() {
    return this.permissiongroupsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissiongroupsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissiongroupDto: UpdatePermissionGroupDto,
  ) {
    return this.permissiongroupsService.update(id, updatePermissiongroupDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissiongroupsService.remove(id);
  }
}
