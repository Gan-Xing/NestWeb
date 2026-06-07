import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/common";
import { DiagnosticsService } from "./diagnostics.service";
import { TestSmsDto } from "./dto/test-sms.dto";

@Controller("api/diagnostics")
@ApiTags("diagnostics")
@ApiBearerAuth()
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get("redis")
  @ApiOkResponse({ description: "Check Redis connectivity." })
  checkRedis(@CurrentUser("isAdmin") isAdmin: boolean) {
    assertAdmin(isAdmin);
    return this.diagnosticsService.checkRedis();
  }

  @Post("sms")
  @ApiOkResponse({ description: "Run a protected SMS provider check." })
  testSms(
    @CurrentUser("isAdmin") isAdmin: boolean,
    @Body() testSmsDto: TestSmsDto,
  ) {
    assertAdmin(isAdmin);
    return this.diagnosticsService.testSms(testSmsDto.phoneNumber);
  }
}

function assertAdmin(isAdmin: boolean) {
  if (!isAdmin) {
    throw new ForbiddenException("Admin privileges are required");
  }
}
