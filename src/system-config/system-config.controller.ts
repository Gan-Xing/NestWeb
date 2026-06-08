import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Permissions } from "src/common";
import { QuerySystemConfigDto, UpdateSystemConfigDto } from "./dto";
import { SystemConfigEntity } from "./entities";
import { SystemConfigService } from "./system-config.service";

@Controller("api/system-config")
@ApiTags("system-config")
@ApiBearerAuth()
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @ApiOkResponse({ type: [SystemConfigEntity] })
  @Permissions("system.config.view")
  findAll(@Query() query: QuerySystemConfigDto) {
    return this.systemConfigService.findAll(query);
  }

  @Get(":id")
  @ApiOkResponse({ type: SystemConfigEntity })
  @Permissions("system.config.view")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return new SystemConfigEntity(await this.systemConfigService.findOne(id));
  }

  @Patch(":id")
  @ApiOkResponse({ type: SystemConfigEntity })
  @Permissions("system.config.update")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSystemConfigDto,
  ) {
    return new SystemConfigEntity(
      await this.systemConfigService.update(id, dto),
    );
  }
}
