import { Controller, Get, Query, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { QueryLogDto } from './dto/query-log.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionEntity } from 'src/permissions/entities';

@Controller('api/system-log')
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Get('export')
  @Permissions(new PermissionEntity({ action: 'GET', path: '/system-log/export' }))
  async export(@Query() query: QueryLogDto) {
    return this.systemLogService.export(query);
  }

  @Delete('clear')
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/system-log/clear' }))
  async clear(@Query('days', ParseIntPipe) days: number) {
    return this.systemLogService.clear(days);
  }

  @Get()
  @Permissions(new PermissionEntity({ action: 'GET', path: '/system-log' }))
  async findAll(@Query() query: QueryLogDto) {
    return this.systemLogService.findAll(query);
  }

  @Get(':id')
  @Permissions(new PermissionEntity({ action: 'GET', path: '/system-log/:id' }))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.systemLogService.findOne(id);
  }
} 