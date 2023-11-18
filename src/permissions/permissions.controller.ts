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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PermissionEntity } from './entities';
import { Permissions } from 'src/common';

@Controller('api/permissions')
@ApiTags('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Create a permission.',
    type: PermissionEntity,
  })
  @Permissions(new PermissionEntity({ action: 'POST', path: '/permissions' }))
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return new PermissionEntity(
      await this.permissionsService.create(createPermissionDto),
    );
  }

  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Get all permissions.',
    type: [PermissionEntity],
  })
  @Permissions(new PermissionEntity({ action: 'GET', path: '/permissions' }))
  async findAll() {
    const permissions = await this.permissionsService.findAll();
    return permissions.map((permission) => new PermissionEntity(permission));
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Find a permission by id.',
    type: PermissionEntity,
  })
  @Permissions(new PermissionEntity({ action: 'GET', path: '/permissions' }))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return new PermissionEntity(await this.permissionsService.findOne(id));
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Update a permission by id.',
    type: PermissionEntity,
  })
  @Permissions(new PermissionEntity({ action: 'Patch', path: '/permissions' }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return new PermissionEntity(
      await this.permissionsService.update(id, updatePermissionDto),
    );
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Delete multiple permissions by ids.',
    type: PermissionEntity,
  })
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/permissions' }))
  async removeMany(@Body() idsDto: { ids: number[] }) {
    return await this.permissionsService.removeMany(idsDto.ids);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Delete a permission by id.',
    type: PermissionEntity,
  })
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/permissions' }))
  async remove(@Param('id', ParseIntPipe) id: number) {
    return new PermissionEntity(await this.permissionsService.remove(id));
  }
}
