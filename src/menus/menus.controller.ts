import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseArrayPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto } from './dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permissions } from 'src/common';
import { PermissionEntity } from 'src/permissions/entities';
import { CurrentUser } from 'src/common';

@Controller('api/menus')
@ApiTags('菜单管理')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'POST', path: '/menus' }))
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'GET', path: '/menus' }))
  async findAllPaged(
    @Query('pageSize') pageSize?: string,  // 移除 ParseIntPipe
    @Query('current') current?: string,    // 移除 ParseIntPipe
    @Query('name') name?: string,
  ) {
    
    // 转换为数字类型并提供默认值
    const size = pageSize ? parseInt(pageSize, 10) : 10;
    const currentPage = current ? parseInt(current, 10) : 1;
    
    return await this.menusService.findAllPaged(currentPage, size, name);
  }

  @Get('user')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findUserMenus(@CurrentUser('id') userId: number) {
    return this.menusService.findMenuByUser(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'GET', path: '/menus' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'PATCH', path: '/menus' }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Delete menus by their IDs.' })
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/menus' }))
  async removeByIds(@Body('ids', ParseArrayPipe) ids: number[]) {
    return this.menusService.removeMenusByIds(ids);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/menus' }))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.remove(id);
  }
}
