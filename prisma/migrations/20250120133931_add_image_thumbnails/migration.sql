/*
  Warnings:

  - The `location` column on the `images` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `description` on table `images` required. This step will fail if there are existing NULL values in that column.
  - Made the column `area` on table `images` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "images" ADD COLUMN     "thumbnails" JSONB[],
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "area" SET NOT NULL,
DROP COLUMN "location",
ADD COLUMN     "location" JSONB,
ALTER COLUMN "category" SET DEFAULT '安全',
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];
