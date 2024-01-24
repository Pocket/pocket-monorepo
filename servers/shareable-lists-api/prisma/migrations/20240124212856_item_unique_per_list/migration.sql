/*
  Warnings:

  - A unique constraint covering the columns `[listId,itemId]` on the table `ListItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ListItem_listId_itemId_key` ON `ListItem`(`listId`, `itemId`);
