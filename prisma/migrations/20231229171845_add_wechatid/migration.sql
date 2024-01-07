-- AlterTable
ALTER TABLE "User" ADD COLUMN     "miniWechatId" TEXT,
ADD COLUMN     "wechatId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
