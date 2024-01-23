/*
  Warnings:

  - You are about to alter the column `userId` on the `List` table. The data in that column could be lost. The data in that column will be cast from `VarChar(300)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE `List` MODIFY `userId` BIGINT NOT NULL;
