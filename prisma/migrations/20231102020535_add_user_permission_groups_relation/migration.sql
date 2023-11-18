-- CreateTable
CREATE TABLE "_UserPermissionGroups" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserPermissionGroups_AB_unique" ON "_UserPermissionGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_UserPermissionGroups_B_index" ON "_UserPermissionGroups"("B");

-- AddForeignKey
ALTER TABLE "_UserPermissionGroups" ADD CONSTRAINT "_UserPermissionGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "PermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPermissionGroups" ADD CONSTRAINT "_UserPermissionGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
