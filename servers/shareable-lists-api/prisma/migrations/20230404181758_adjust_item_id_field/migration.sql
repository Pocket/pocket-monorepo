/*
  Warnings:

  - Made the column `itemId` on table `ListItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ListItem` MODIFY `itemId` BIGINT NOT NULL;
