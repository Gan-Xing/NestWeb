-- S2 account security + role capability packs.

ALTER TABLE "Role"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "sort" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Role_enabled_sort_idx" ON "Role"("enabled", "sort");

ALTER TABLE "User"
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "lastLoginIp" TEXT,
  ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3);

UPDATE "User"
SET "status" = CASE
  WHEN "status" IS NULL OR "status" = '' THEN 'active'
  WHEN lower("status") IN ('1', 'active', 'enabled', '在职') THEN 'active'
  WHEN lower("status") IN ('0', 'resigned', 'inactive', '离职') THEN 'resigned'
  WHEN lower("status") IN ('disabled', '禁用') THEN 'disabled'
  ELSE "status"
END;

CREATE TABLE "login_logs" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "username" TEXT,
  "email" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "success" BOOLEAN NOT NULL,
  "failureCode" TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "login_logs_userId_createdAt_idx" ON "login_logs"("userId", "createdAt");
CREATE INDEX "login_logs_email_idx" ON "login_logs"("email");
CREATE INDEX "login_logs_success_createdAt_idx" ON "login_logs"("success", "createdAt");

ALTER TABLE "login_logs"
  ADD CONSTRAINT "login_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
