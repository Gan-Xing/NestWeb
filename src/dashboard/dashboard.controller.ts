import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Permissions } from "src/common";
import { PermissionEntity } from "src/permissions/entities";
import { DashboardService } from "./dashboard.service";
import { DashboardSummaryEntity } from "./entities/dashboard-summary.entity";

@Controller("api/dashboard")
@ApiTags("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DashboardSummaryEntity })
  @Permissions(new PermissionEntity({ action: "GET", path: "/dashboard" }))
  summary(
    @CurrentUser("id") userId: number,
    @CurrentUser("isAdmin") isAdmin: boolean,
  ) {
    return this.dashboardService.getSummary({ id: userId, isAdmin });
  }
}
