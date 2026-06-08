import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser, Permissions } from "src/common";
import {
  ApprovalActionDto,
  CreateApprovalRequestDto,
  QueryApprovalRequestDto,
} from "./dto";
import { ApprovalRequestEntity, ApprovalRequestListEntity } from "./entities";
import { ApprovalRequestsService } from "./approval-requests.service";

type CurrentUserRef = {
  id: number;
  isAdmin?: boolean;
};

@Controller("api/approval-requests")
@ApiTags("approval-requests")
@ApiBearerAuth()
export class ApprovalRequestsController {
  constructor(
    private readonly approvalRequestsService: ApprovalRequestsService,
  ) {}

  @Get()
  @ApiOkResponse({ type: ApprovalRequestListEntity })
  @Permissions("approval.requests.view")
  findAll(
    @Query() query: QueryApprovalRequestDto,
    @CurrentUser() currentUser: CurrentUserRef,
  ) {
    return this.approvalRequestsService.findAll(query, currentUser);
  }

  @Post()
  @ApiCreatedResponse({ type: ApprovalRequestEntity })
  @Permissions("approval.requests.create")
  async create(
    @Body() dto: CreateApprovalRequestDto,
    @CurrentUser("id") userId: number,
  ) {
    return new ApprovalRequestEntity(
      await this.approvalRequestsService.create(dto, userId),
    );
  }

  @Get(":id")
  @ApiOkResponse({ type: ApprovalRequestEntity })
  @Permissions("approval.requests.view")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserRef,
  ) {
    return new ApprovalRequestEntity(
      await this.approvalRequestsService.findOne(id, currentUser),
    );
  }

  @Post(":id/approve")
  @ApiOkResponse({ type: ApprovalRequestEntity })
  @Permissions("approval.requests.approve")
  async approve(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() currentUser: CurrentUserRef,
  ) {
    return new ApprovalRequestEntity(
      await this.approvalRequestsService.approve(id, currentUser, dto),
    );
  }

  @Post(":id/reject")
  @ApiOkResponse({ type: ApprovalRequestEntity })
  @Permissions("approval.requests.reject")
  async reject(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() currentUser: CurrentUserRef,
  ) {
    return new ApprovalRequestEntity(
      await this.approvalRequestsService.reject(id, currentUser, dto),
    );
  }

  @Post(":id/cancel")
  @ApiOkResponse({ type: ApprovalRequestEntity })
  @Permissions("approval.requests.view")
  async cancel(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() currentUser: CurrentUserRef,
  ) {
    return new ApprovalRequestEntity(
      await this.approvalRequestsService.cancel(id, currentUser, dto),
    );
  }

  @Post(":id/comment")
  @ApiOkResponse({ type: ApprovalRequestEntity })
  @Permissions("approval.requests.view")
  async comment(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() currentUser: CurrentUserRef,
  ) {
    return new ApprovalRequestEntity(
      await this.approvalRequestsService.comment(id, currentUser, dto),
    );
  }
}
