import {
  ApprovalAction,
  ApprovalActionType,
  ApprovalApproverType,
  ApprovalRequest,
  ApprovalRequestStatus,
  Prisma,
} from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApprovalUserSummaryEntity {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  username?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class ApprovalActionEntity implements ApprovalAction {
  constructor(partial: Partial<ApprovalActionEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  requestId: number;

  @ApiProperty()
  actorId: number;

  @ApiProperty({ enum: ApprovalActionType })
  action: ApprovalActionType;

  @ApiPropertyOptional()
  comment: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: ApprovalUserSummaryEntity })
  actor?: ApprovalUserSummaryEntity;
}

export class ApprovalRequestEntity implements ApprovalRequest {
  constructor(partial: Partial<ApprovalRequestEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  businessType: string;

  @ApiPropertyOptional()
  businessId: string | null;

  @ApiPropertyOptional()
  payload: Prisma.JsonValue | null;

  @ApiProperty()
  applicantId: number;

  @ApiProperty({ enum: ApprovalApproverType })
  approverType: ApprovalApproverType;

  @ApiPropertyOptional()
  approverUserId: number | null;

  @ApiPropertyOptional()
  approverRoleCode: string | null;

  @ApiProperty({ enum: ApprovalRequestStatus })
  status: ApprovalRequestStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  decidedAt: Date | null;

  @ApiPropertyOptional({ type: ApprovalUserSummaryEntity })
  applicant?: ApprovalUserSummaryEntity;

  @ApiPropertyOptional({ type: ApprovalUserSummaryEntity })
  approverUser?: ApprovalUserSummaryEntity | null;

  @ApiPropertyOptional({ type: [ApprovalActionEntity] })
  actions?: ApprovalActionEntity[];
}

export class ApprovalRequestPaginationEntity {
  @ApiProperty()
  current: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ApprovalRequestListEntity {
  @ApiProperty({ type: [ApprovalRequestEntity] })
  data: ApprovalRequestEntity[];

  @ApiProperty({ type: ApprovalRequestPaginationEntity })
  pagination: ApprovalRequestPaginationEntity;
}
