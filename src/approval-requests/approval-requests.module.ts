import { Module } from "@nestjs/common";
import { MessagesModule } from "src/messages/messages.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { ApprovalRequestsController } from "./approval-requests.controller";
import { ApprovalRequestsService } from "./approval-requests.service";

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [ApprovalRequestsController],
  providers: [ApprovalRequestsService],
})
export class ApprovalRequestsModule {}
