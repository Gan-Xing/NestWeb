import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Permissions } from "src/common";
import { QueryMessageDto } from "./dto";
import {
  MessageEntity,
  MessageListEntity,
  MessageUnreadCountEntity,
} from "./entities";
import { MessagesService } from "./messages.service";

@Controller("api/messages")
@ApiTags("messages")
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOkResponse({ type: MessageListEntity })
  @Permissions("message.view")
  findAll(
    @Query() query: QueryMessageDto,
    @CurrentUser() currentUser: { id: number; isAdmin?: boolean },
  ) {
    return this.messagesService.findAll(query, currentUser);
  }

  @Get("unread-count")
  @ApiOkResponse({ type: MessageUnreadCountEntity })
  @Permissions("message.view")
  unreadCount(@CurrentUser("id") userId: number) {
    return this.messagesService.unreadCount(userId);
  }

  @Post("read-all")
  @ApiOkResponse()
  @Permissions("message.view")
  markAllRead(@CurrentUser("id") userId: number) {
    return this.messagesService.markAllRead(userId);
  }

  @Post(":id/read")
  @ApiOkResponse({ type: MessageEntity })
  @Permissions("message.view")
  async markRead(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser("id") userId: number,
  ) {
    return new MessageEntity(await this.messagesService.markRead(id, userId));
  }

  @Post(":id/complete")
  @ApiOkResponse({ type: MessageEntity })
  @Permissions("message.complete")
  async completeTodo(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser("id") userId: number,
  ) {
    return new MessageEntity(
      await this.messagesService.completeTodo(id, userId),
    );
  }

  @Post(":id/cancel")
  @ApiOkResponse({ type: MessageEntity })
  @Permissions("message.complete")
  async cancelTodo(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser("id") userId: number,
  ) {
    return new MessageEntity(await this.messagesService.cancelTodo(id, userId));
  }
}
