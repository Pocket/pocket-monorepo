-- CreateIndex
CREATE INDEX `List_userId_moderationStatus_updatedAt_idx` ON `List`(`userId`, `moderationStatus`, `updatedAt`);
