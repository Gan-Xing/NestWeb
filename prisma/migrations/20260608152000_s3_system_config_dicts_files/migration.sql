-- S3 system dictionaries, runtime configs, and file center.

CREATE TABLE "dict_types" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dict_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dict_items" (
  "id" SERIAL NOT NULL,
  "dictTypeId" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "color" TEXT,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dict_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_configs" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "valueType" TEXT NOT NULL DEFAULT 'string',
  "group" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "editable" BOOLEAN NOT NULL DEFAULT true,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "file_assets" (
  "id" SERIAL NOT NULL,
  "originalName" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "extension" TEXT,
  "category" TEXT,
  "description" TEXT,
  "uploaderId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dict_types_code_key" ON "dict_types"("code");
CREATE INDEX "dict_types_enabled_sort_idx" ON "dict_types"("enabled", "sort");

CREATE UNIQUE INDEX "dict_items_dictTypeId_code_key" ON "dict_items"("dictTypeId", "code");
CREATE UNIQUE INDEX "dict_items_dictTypeId_value_key" ON "dict_items"("dictTypeId", "value");
CREATE INDEX "dict_items_dictTypeId_enabled_sort_idx" ON "dict_items"("dictTypeId", "enabled", "sort");

CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");
CREATE INDEX "system_configs_group_enabled_sort_idx" ON "system_configs"("group", "enabled", "sort");

CREATE UNIQUE INDEX "file_assets_storagePath_key" ON "file_assets"("storagePath");
CREATE INDEX "file_assets_category_idx" ON "file_assets"("category");
CREATE INDEX "file_assets_uploaderId_createdAt_idx" ON "file_assets"("uploaderId", "createdAt");
CREATE INDEX "file_assets_deletedAt_createdAt_idx" ON "file_assets"("deletedAt", "createdAt");

ALTER TABLE "dict_items"
  ADD CONSTRAINT "dict_items_dictTypeId_fkey"
  FOREIGN KEY ("dictTypeId") REFERENCES "dict_types"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "file_assets"
  ADD CONSTRAINT "file_assets_uploaderId_fkey"
  FOREIGN KEY ("uploaderId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
