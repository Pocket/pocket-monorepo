/*
  Warnings:

  - You are about to alter the column `updatedAt` on the `List` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `updatedAt` on the `ListItem` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `List` MODIFY `createdAt` DATETIME(0) NOT NULL DEFAULT now(),
    MODIFY `updatedAt` DATETIME(0) NOT NULL DEFAULT now();

-- AlterTable
ALTER TABLE `ListItem` MODIFY `createdAt` DATETIME(0) NOT NULL DEFAULT now(),
    MODIFY `updatedAt` DATETIME(0) NOT NULL DEFAULT now();
