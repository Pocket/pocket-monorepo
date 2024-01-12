-- CreateTable
CREATE TABLE `List` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(300) NOT NULL,
    `slug` VARCHAR(300) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
    `moderationStatus` ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
    `moderatedBy` VARCHAR(255) NULL,
    `moderationReason` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `List_externalId_key`(`externalId`),
    UNIQUE INDEX `List_userId_slug_key`(`userId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListItem` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `listId` BIGINT NOT NULL,
    `itemId` INTEGER NULL,
    `url` VARCHAR(500) NULL,
    `title` VARCHAR(300) NULL,
    `excerpt` TEXT NULL,
    `imageUrl` TEXT NULL,
    `authors` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ListItem_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ListItem` ADD CONSTRAINT `ListItem_listId_fkey` FOREIGN KEY (`listId`) REFERENCES `List`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
