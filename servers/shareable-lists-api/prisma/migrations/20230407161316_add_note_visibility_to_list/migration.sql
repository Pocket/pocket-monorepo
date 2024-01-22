-- customized to require null after backfilling
ALTER TABLE `List` ADD COLUMN `listItemNoteVisibility` ENUM('PRIVATE', 'PUBLIC') NULL DEFAULT 'PRIVATE';

-- backfill all existing rows
UPDATE `List` SET `listItemNoteVisibility` = 'PRIVATE';

-- set field to NOT NULL
ALTER TABLE `List` MODIFY `listItemNoteVisibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE';
