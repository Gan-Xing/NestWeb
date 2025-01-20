/*
  Warnings:

  - You are about to drop the `PhotoLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoLog" DROP CONSTRAINT "PhotoLog_createdById_fkey";

-- DropTable
DROP TABLE "PhotoLog";

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "description" TEXT,
    "area" TEXT,
    "photos" TEXT[],
    "location" TEXT,
    "stakeNumber" TEXT,
    "offset" DOUBLE PRECISION,
    "category" TEXT NOT NULL DEFAULT '进度',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
