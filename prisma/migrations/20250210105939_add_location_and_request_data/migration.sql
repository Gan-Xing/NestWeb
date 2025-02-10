-- AlterTable
ALTER TABLE "system_logs" ADD COLUMN     "location" JSONB,
ADD COLUMN     "requestData" JSONB;
