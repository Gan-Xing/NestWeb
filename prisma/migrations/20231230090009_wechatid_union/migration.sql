/*
  Warnings:

  - A unique constraint covering the columns `[wechatId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_wechatId_key" ON "User"("wechatId");
