import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Permissions } from "src/common";
import { QueryLoginLogDto } from "./dto/query-login-log.dto";
import { LoginLogEntity } from "./entities/login-log.entity";
import { LoginLogsService } from "./login-logs.service";

@Controller("api/security/login-logs")
@ApiTags("login-logs")
@ApiBearerAuth()
export class LoginLogsController {
  constructor(private readonly loginLogsService: LoginLogsService) {}

  @Get()
  @ApiOkResponse({ type: [LoginLogEntity] })
  @Permissions("security.loginLogs.view")
  async findAll(@Query() query: QueryLoginLogDto) {
    return this.loginLogsService.findAll(query);
  }

  @Get(":id")
  @ApiOkResponse({ type: LoginLogEntity })
  @Permissions("security.loginLogs.view")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return new LoginLogEntity(await this.loginLogsService.findOne(id));
  }
}
