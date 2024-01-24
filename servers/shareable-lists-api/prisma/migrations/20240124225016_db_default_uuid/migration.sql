/*
  Warnings:

  - You are about to alter the column `externalId` on the `List` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(36)`.
  - You are about to alter the column `externalId` on the `ListItem` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(36)`.

*/
-- AlterTable
ALTER TABLE `List` MODIFY `externalId` VARCHAR(36) NOT NULL DEFAULT (UUID());

-- AlterTable
ALTER TABLE `ListItem` MODIFY `externalId` VARCHAR(36) NOT NULL DEFAULT (UUID());
