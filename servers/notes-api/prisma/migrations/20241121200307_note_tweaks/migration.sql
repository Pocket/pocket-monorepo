/*
  Warnings:

  - Made the column `clippingId` on table `Clipping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `noteId` on table `Note` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Clipping" ALTER COLUMN "clippingId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "noteId" SET NOT NULL,
ALTER COLUMN "title" DROP NOT NULL;
