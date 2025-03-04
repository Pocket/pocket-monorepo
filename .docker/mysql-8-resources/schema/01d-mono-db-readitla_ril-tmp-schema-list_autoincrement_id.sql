CREATE DATABASE IF NOT EXISTS `readitla_ril-tmp`;

USE `readitla_ril-tmp`;

ALTER TABLE `list`
ADD CONSTRAINT `old_primary` UNIQUE (`user_id`,`item_id`)
;

ALTER TABLE `list`
DROP PRIMARY KEY
;

--  The same schema as list, except uses expanded types for item_id and resolved_id.
ALTER TABLE `list` 
  MODIFY `item_id` bigint unsigned NOT NULL,
  MODIFY `resolved_id` bigint unsigned NOT NULL,
  ADD COLUMN `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);

