import { Message, MessageCategory, MessageType } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MessageEntity implements Message {
  constructor(partial: Partial<MessageEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  content: string | null;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty({ enum: MessageCategory })
  category: MessageCategory;

  @ApiPropertyOptional()
  link: string | null;

  @ApiPropertyOptional()
  businessType: string | null;

  @ApiPropertyOptional()
  businessId: string | null;

  @ApiPropertyOptional()
  readAt: Date | null;

  @ApiPropertyOptional()
  completedAt: Date | null;

  @ApiPropertyOptional()
  cancelledAt: Date | null;

  @ApiPropertyOptional()
  createdById: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MessagePaginationEntity {
  @ApiProperty()
  current: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class MessageListEntity {
  @ApiProperty({ type: [MessageEntity] })
  data: MessageEntity[];

  @ApiProperty({ type: MessagePaginationEntity })
  pagination: MessagePaginationEntity;
}

export class MessageUnreadCountEntity {
  @ApiProperty()
  unreadNotifications: number;

  @ApiProperty()
  pendingTodos: number;

  @ApiProperty()
  total: number;
}
