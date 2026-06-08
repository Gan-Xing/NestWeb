import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Permissions } from "src/common";
import {
  SystemQueuesEntity,
  SystemStatusEntity,
  SystemVersionEntity,
} from "./entities/system-status.entity";
import { SystemService } from "./system.service";

@Controller("api/system")
@ApiTags("system")
@ApiBearerAuth()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get("status")
  @ApiOkResponse({ type: SystemStatusEntity })
  @Permissions("system.status.view")
  getStatus() {
    return this.systemService.getStatus();
  }

  @Get("version")
  @ApiOkResponse({ type: SystemVersionEntity })
  @Permissions("system.version.view")
  getVersion() {
    return this.systemService.getVersion();
  }

  @Get("queues")
  @ApiOkResponse({ type: SystemQueuesEntity })
  @Permissions("system.queues.view")
  getQueues() {
    return this.systemService.getQueues();
  }
}
