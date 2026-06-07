ALTER TABLE "PermissionGroup" ADD COLUMN "code" TEXT;
ALTER TABLE "PermissionGroup" ADD COLUMN "icon" TEXT;
ALTER TABLE "PermissionGroup" ADD COLUMN "sort" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PermissionGroup" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;

UPDATE "PermissionGroup"
SET "code" = lower(regexp_replace(coalesce("path", 'menu') || ':' || "id"::text, '[^a-zA-Z0-9]+', '_', 'g'))
WHERE "code" IS NULL;

ALTER TABLE "PermissionGroup" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "PermissionGroup_code_key" ON "PermissionGroup"("code");

ALTER TABLE "permissions" ADD COLUMN "code" TEXT;

UPDATE "permissions"
SET "code" = lower(regexp_replace(coalesce("action", 'action') || ':' || coalesce("path", 'path') || ':' || "id"::text, '[^a-zA-Z0-9]+', '_', 'g'))
WHERE "code" IS NULL;

ALTER TABLE "permissions" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
