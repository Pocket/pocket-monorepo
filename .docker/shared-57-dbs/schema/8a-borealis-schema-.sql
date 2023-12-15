CREATE DATABASE IF NOT EXISTS `borealis`;

USE `borealis`;


CREATE TABLE `item_saves` (
  `item_id` bigint(20) unsigned NOT NULL,
  `save_count_all` int(10) unsigned NOT NULL DEFAULT '0',
  `save_count_whitelisted` int(10) unsigned NOT NULL DEFAULT '0',
  `resolved_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `resolved_id` (`resolved_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `resolved_saves` (
  `resolved_id` bigint(20) unsigned NOT NULL,
  `save_count_all` int(10) unsigned NOT NULL DEFAULT '0',
  `save_count_whitelisted` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`resolved_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
