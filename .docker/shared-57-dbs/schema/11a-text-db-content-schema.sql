CREATE DATABASE IF NOT EXISTS `content`;

USE `content`;

# Dump of table content
# ------------------------------------------------------------

CREATE TABLE `content`
(
  `item_id` int(10) unsigned NOT NULL,
  `content` mediumblob NOT NULL,
  `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`item_id`)
)
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
PARTITION BY HASH (item_id DIV 1048576) PARTITIONS 256;
