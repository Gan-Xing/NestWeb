/*
  Warnings:

  - You are about to drop the `_UserPermissionGroups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserPermissionGroups" DROP CONSTRAINT "_UserPermissionGroups_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserPermissionGroups" DROP CONSTRAINT "_UserPermissionGroups_B_fkey";

-- DropTable
DROP TABLE "_UserPermissionGroups";
