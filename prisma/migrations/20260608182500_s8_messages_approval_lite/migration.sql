-- S8 message center + approval lite.

CREATE TYPE "MessageType" AS ENUM ('NOTIFICATION', 'TODO');
CREATE TYPE "MessageCategory" AS ENUM ('SYSTEM', 'SECURITY', 'APPROVAL', 'TASK', 'CUSTOM');
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ApprovalActionType" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'CANCEL', 'COMMENT');
CREATE TYPE "ApprovalApproverType" AS ENUM ('USER', 'ROLE');

CREATE TABLE "messages" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "type" "MessageType" NOT NULL,
  "category" "MessageCategory" NOT NULL DEFAULT 'SYSTEM',
  "link" TEXT,
  "businessType" TEXT,
  "businessId" TEXT,
  "readAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_requests" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "businessType" TEXT NOT NULL,
  "businessId" TEXT,
  "payload" JSONB,
  "applicantId" INTEGER NOT NULL,
  "approverType" "ApprovalApproverType" NOT NULL,
  "approverUserId" INTEGER,
  "approverRoleCode" TEXT,
  "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "decidedAt" TIMESTAMP(3),

  CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_actions" (
  "id" SERIAL NOT NULL,
  "requestId" INTEGER NOT NULL,
  "actorId" INTEGER NOT NULL,
  "action" "ApprovalActionType" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "approval_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_userId_type_createdAt_idx" ON "messages"("userId", "type", "createdAt");
CREATE INDEX "messages_userId_readAt_idx" ON "messages"("userId", "readAt");
CREATE INDEX "messages_userId_completedAt_idx" ON "messages"("userId", "completedAt");
CREATE INDEX "messages_businessType_businessId_idx" ON "messages"("businessType", "businessId");

CREATE INDEX "approval_requests_businessType_businessId_idx" ON "approval_requests"("businessType", "businessId");
CREATE INDEX "approval_requests_applicantId_createdAt_idx" ON "approval_requests"("applicantId", "createdAt");
CREATE INDEX "approval_requests_status_createdAt_idx" ON "approval_requests"("status", "createdAt");
CREATE INDEX "approval_requests_approverUserId_status_idx" ON "approval_requests"("approverUserId", "status");
CREATE INDEX "approval_requests_approverRoleCode_status_idx" ON "approval_requests"("approverRoleCode", "status");

CREATE INDEX "approval_actions_requestId_createdAt_idx" ON "approval_actions"("requestId", "createdAt");
CREATE INDEX "approval_actions_actorId_createdAt_idx" ON "approval_actions"("actorId", "createdAt");

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "approval_requests"
  ADD CONSTRAINT "approval_requests_applicantId_fkey"
  FOREIGN KEY ("applicantId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "approval_requests"
  ADD CONSTRAINT "approval_requests_approverUserId_fkey"
  FOREIGN KEY ("approverUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "approval_actions"
  ADD CONSTRAINT "approval_actions_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "approval_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_actions"
  ADD CONSTRAINT "approval_actions_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
