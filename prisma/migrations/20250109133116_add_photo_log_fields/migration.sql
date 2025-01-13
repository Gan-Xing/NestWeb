-- AlterTable
ALTER TABLE "PhotoLog" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '安全',
ADD COLUMN     "location" JSONB,
ADD COLUMN     "offset" DOUBLE PRECISION,
ADD COLUMN     "stakeNumber" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
