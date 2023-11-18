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
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { RoleEntity } from './entities';
import { Permissions } from 'src/common';
import { PermissionEntity } from 'src/permissions/entities';

@Controller('api/roles')
@ApiTags('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Create a role.', type: RoleEntity })
  @Permissions(new PermissionEntity({ action: 'POST', path: '/roles' }))
  async create(@Body() createRoleDto: CreateRoleDto) {
    return new RoleEntity(await this.rolesService.create(createRoleDto));
  }

  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Get all roles.', type: [RoleEntity] })
  @Permissions(new PermissionEntity({ action: 'GET', path: '/roles' }))
  async findAll() {
    const roles = await this.rolesService.findAll();
    return roles.map((role) => new RoleEntity(role));
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Delete multiple roles by ids.',
    type: RoleEntity,
  })
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/roles' }))
  async removeMany(@Body() idsDto: { ids: number[] }) {
    return await this.rolesService.removeMany(idsDto.ids);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Find a role by id.', type: RoleEntity })
  @Permissions(new PermissionEntity({ action: 'GET', path: '/roles' }))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return new RoleEntity(await this.rolesService.findOne(id));
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Update a role by id.', type: RoleEntity })
  @Permissions(new PermissionEntity({ action: 'Patch', path: '/roles' }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return new RoleEntity(await this.rolesService.update(id, updateRoleDto));
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Delete a role by id.', type: RoleEntity })
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/roles' }))
  async remove(@Param('id', ParseIntPipe) id: number) {
    return new RoleEntity(await this.rolesService.remove(id));
  }
}
