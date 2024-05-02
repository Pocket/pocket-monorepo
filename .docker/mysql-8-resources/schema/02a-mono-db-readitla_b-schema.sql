CREATE DATABASE IF NOT EXISTS `readitla_b`;

USE `readitla_b`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;



# Dump of table article_reports
# ------------------------------------------------------------

CREATE TABLE `article_reports` (
  `item_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `api_id` mediumint(8) unsigned NOT NULL,
  `time_submitted` datetime NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `item_id` (`item_id`),
  KEY `time_submitted` (`time_submitted`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table attributions_twitter
# ------------------------------------------------------------

CREATE TABLE `attributions_twitter` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status_id` bigint(20) unsigned NOT NULL,
  `twitter_user_id` bigint(20) unsigned NOT NULL,
  `date` datetime NOT NULL,
  `text` varchar(140) COLLATE utf8_unicode_ci NOT NULL,
  `in_reply_to_status_id` bigint(20) unsigned NOT NULL,
  `in_reply_to_user_id` bigint(20) unsigned NOT NULL,
  `lang` varchar(7) COLLATE utf8_unicode_ci NOT NULL,
  `geo_lat` decimal(10,8) NOT NULL,
  `geo_long` decimal(11,8) NOT NULL,
  `geo_place` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `json_entities` text COLLATE utf8_unicode_ci NOT NULL,
  `time_processed` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `status_id` (`status_id`),
  KEY `twitter_user_id` (`twitter_user_id`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table attributions_twitter_links
# ------------------------------------------------------------

CREATE TABLE `attributions_twitter_links` (
  `status_id` bigint(20) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text COLLATE utf8_unicode_ci NOT NULL,
  `resolved_id` int(10) unsigned NOT NULL,
  `expanded_url` text COLLATE utf8_unicode_ci NOT NULL,
  `expanded_item_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`status_id`,`item_id`),
  KEY `item_id` (`item_id`),
  KEY `resolved_id` (`resolved_id`),
  KEY `expanded_item_id` (`expanded_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table attributions_twitter_users
# ------------------------------------------------------------

CREATE TABLE `attributions_twitter_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `twitter_user_id` bigint(20) unsigned NOT NULL,
  `screen_name` varchar(15) COLLATE utf8_unicode_ci NOT NULL,
  `name` text COLLATE utf8_unicode_ci NOT NULL,
  `followers_count` int(10) unsigned NOT NULL,
  `friends_count` int(10) unsigned NOT NULL,
  `listed_count` int(10) unsigned NOT NULL,
  `statuses_count` int(10) unsigned NOT NULL,
  `profile_image_url` text COLLATE utf8_unicode_ci NOT NULL,
  `time_processed` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `twitter_user_id` (`twitter_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table authors
# ------------------------------------------------------------

CREATE TABLE `authors` (
  `author_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `url` text NOT NULL,
  `int_1` int(10) unsigned DEFAULT NULL,
  `int_2` int(10) unsigned DEFAULT NULL,
  `int_3` int(10) unsigned DEFAULT NULL,
  `chr_1` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `chr_2` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `chr_3` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`author_id`),
  KEY `domain` (`name`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table c2dm_pending_pings
# ------------------------------------------------------------

CREATE TABLE `c2dm_pending_pings` (
  `user_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table date_published_threshold
# ------------------------------------------------------------

CREATE TABLE `date_published_threshold` (
  `date_published` int(10) unsigned NOT NULL,
  `popular_save_threshold` smallint(5) unsigned DEFAULT '0',
  `trending_save_threshold` smallint(5) unsigned DEFAULT '0',
  `best_score_threshold` decimal(21,20) unsigned DEFAULT '0.00000000000000000000',
  PRIMARY KEY (`date_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table digest_items_tags_stemmed
# ------------------------------------------------------------

CREATE TABLE `digest_items_tags_stemmed` (
  `item_id` int(10) unsigned NOT NULL,
  `tag` varchar(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `type` tinyint(3) unsigned NOT NULL,
  `score` decimal(5,4) NOT NULL,
  PRIMARY KEY (`item_id`,`tag`),
  KEY `type` (`type`),
  KEY `tagScore` (`tag`,`score`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8
  /*!50100 PARTITION BY RANGE ( item_id)
(PARTITION p0 VALUES LESS THAN (5000000) ENGINE = InnoDB,
PARTITION p1 VALUES LESS THAN (10000000) ENGINE = InnoDB,
PARTITION p2 VALUES LESS THAN (15000000) ENGINE = InnoDB,
PARTITION p3 VALUES LESS THAN (20000000) ENGINE = InnoDB,
PARTITION p4 VALUES LESS THAN (25000000) ENGINE = InnoDB,
PARTITION p5 VALUES LESS THAN (30000000) ENGINE = InnoDB,
PARTITION p6 VALUES LESS THAN (35000000) ENGINE = InnoDB,
PARTITION p7 VALUES LESS THAN (40000000) ENGINE = InnoDB,
PARTITION p8 VALUES LESS THAN (45000000) ENGINE = InnoDB,
PARTITION p9 VALUES LESS THAN (50000000) ENGINE = InnoDB,
PARTITION p10 VALUES LESS THAN (55000000) ENGINE = InnoDB,
PARTITION p11 VALUES LESS THAN (60000000) ENGINE = InnoDB,
PARTITION p12 VALUES LESS THAN (65000000) ENGINE = InnoDB,
PARTITION p13 VALUES LESS THAN (70000000) ENGINE = InnoDB,
PARTITION p14 VALUES LESS THAN (75000000) ENGINE = InnoDB,
PARTITION p15 VALUES LESS THAN (80000000) ENGINE = InnoDB,
PARTITION p16 VALUES LESS THAN (85000000) ENGINE = InnoDB,
PARTITION p17 VALUES LESS THAN (90000000) ENGINE = InnoDB,
PARTITION p18 VALUES LESS THAN (105000000) ENGINE = InnoDB,
PARTITION p19 VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */;



# Dump of table domain_flag_types
# ------------------------------------------------------------

CREATE TABLE `domain_flag_types` (
  `flag_type_id` tinyint(1) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(75) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`flag_type_id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table domain_flags
# ------------------------------------------------------------

CREATE TABLE `domain_flags` (
  `domain_id` int(10) unsigned NOT NULL,
  `flag_type_id` tinyint(1) unsigned NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`domain_id`,`flag_type_id`),
  KEY `flag_type` (`flag_type_id`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table domains
# ------------------------------------------------------------

CREATE TABLE `domains` (
  `domain_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(75) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `top_domain_id` int(10) unsigned NOT NULL,
  `top_domain_id` int(10) unsigned,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`domain_id`),
  KEY `domain` (`domain`),
  KEY `top_domain_id` (`top_domain_id`,`domain_id`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table grouping
# ------------------------------------------------------------

CREATE TABLE `grouping` (
  `grouping_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_grouping_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `stemmed_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `grouping_type_id` smallint(5) unsigned NOT NULL,
  `origin_id` bigint(20) unsigned DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`grouping_id`),
  KEY `parent_grouping_idx` (`parent_grouping_id`),
  KEY `type_name_idx` (`grouping_type_id`,`name`),
  KEY `type_origin_idx` (`grouping_type_id`,`origin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table grouping_sort
# ------------------------------------------------------------

CREATE TABLE `grouping_sort` (
  `grouping_id` bigint(20) unsigned NOT NULL,
  `sort` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`grouping_id`),
  KEY `sort_idx` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table grouping_type
# ------------------------------------------------------------

CREATE TABLE `grouping_type` (
  `grouping_type_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`grouping_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table item_grouping
# ------------------------------------------------------------

CREATE TABLE `item_grouping` (
  `resolved_id` int(10) unsigned NOT NULL,
  `grouping_id` bigint(20) unsigned NOT NULL,
  `source_score` decimal(21,20) unsigned NOT NULL,
  PRIMARY KEY (`resolved_id`,`grouping_id`),
  KEY `grouping_idx` (`grouping_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table item_lang
# ------------------------------------------------------------

CREATE TABLE `item_lang` (
  `extended_item_id` int(10) unsigned NOT NULL DEFAULT '0',
  `lang` varchar(15) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`extended_item_id`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table item_stats
# ------------------------------------------------------------

CREATE TABLE `item_stats` (
  `resolved_id` int(10) unsigned NOT NULL,
  `added_hour_id` int(10) DEFAULT '0',
  `added_date` date DEFAULT NULL,
  `save_cnt` int(10) unsigned DEFAULT '0',
  `total_score` decimal(7,4) DEFAULT NULL,
  `last_update_time` int(10) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`resolved_id`),
  KEY `resolved_score_idx` (`resolved_id`,`total_score`),
  KEY `update_idx` (`last_update_time`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table items_authors
# ------------------------------------------------------------

CREATE TABLE `items_authors` (
  `item_id` int(10) unsigned NOT NULL,
  `author_id` int(10) unsigned NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`,`author_id`),
  KEY `author_id` (`author_id`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_extended
# ------------------------------------------------------------

CREATE TABLE `items_extended` (
                                `extended_item_id`     int(10) unsigned                                                                 NOT NULL,
                                `resolved_url`         text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin                                   NOT NULL,
                                `domain_id`            int(10) unsigned                                                                 NOT NULL,
                                `origin_domain_id`     int(10) unsigned                                                                 NOT NULL,
                                `response_code`        smallint(5) unsigned                                                             NOT NULL,
                                `mime_type`            varchar(254)                                                                     NOT NULL,
                                `content_length`       mediumint(8) unsigned                                                            NOT NULL,
                                `encoding`             varchar(35)                                                                      NOT NULL,
                                `date_resolved`        datetime                                                                         NOT NULL,
                                `date_published`       datetime                                                                         NOT NULL,
                                `title`                text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin                                   NOT NULL,
                                `excerpt`              text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin                                   NOT NULL,
                                `word_count`           smallint(5) unsigned                                                             NOT NULL,
                                `innerdomain_redirect` tinyint(1)                                                                       NOT NULL,
                                `digest_parsed`        tinyint(1)                                                                       NOT NULL,
                                `image`                tinyint(1)                                                                       NOT NULL,
                                `video`                tinyint(1)                                                                       NOT NULL,
                                `is_index`             tinyint(1)                                                                       NOT NULL,
                                `is_article`           tinyint(1)                                                                       NOT NULL,
                                `used_fallback` tinyint(1) NOT NULL,
                                `item_type_id`  smallint(5) unsigned                                   DEFAULT NULL,
                                `lang`          varchar(10)                                            DEFAULT NULL,
                                `pages`         smallint(5) unsigned                                   DEFAULT NULL,
                                `int_1`         int(10) unsigned                                       DEFAULT NULL,
                                `int_2`                int(10) unsigned                                       DEFAULT NULL,
                                `int_3`                int(10) unsigned                                       DEFAULT NULL,
                                `chr_1`                varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
                                `chr_2`                varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
                                `chr_3`                varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
                                `created_at`           datetime                                               DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                `updated_at`           datetime                                               DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
                                PRIMARY KEY (`extended_item_id`),
                                KEY `word_count` (`word_count`),
                                KEY `domain_id` (`domain_id`),
                                KEY `origin_domain_id` (`origin_domain_id`),
                                KEY `is_article` (`is_article`),
                                KEY `date_resolved` (`date_resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table items_images
# ------------------------------------------------------------

CREATE TABLE `items_images` (
  `item_id` int(10) unsigned NOT NULL,
  `image_id` tinyint(3) unsigned NOT NULL,
  `src` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `width` smallint(5) unsigned NOT NULL,
  `height` smallint(5) unsigned NOT NULL,
  `credit` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `caption` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `int_1` int(10) unsigned DEFAULT NULL,
  `int_2` int(10) unsigned DEFAULT NULL,
  `int_3` int(10) unsigned DEFAULT NULL,
  `chr_1` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `chr_2` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `chr_3` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`item_id`,`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table items_links
# ------------------------------------------------------------

CREATE TABLE `items_links` (
  `item_id` int(10) unsigned NOT NULL,
  `link_item_id` int(10) unsigned NOT NULL,
  `anchor_text` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `count` tinyint(1) unsigned NOT NULL,
  PRIMARY KEY (`item_id`,`link_item_id`),
  KEY `link_item_id` (`link_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table items_meta
# ------------------------------------------------------------

CREATE TABLE `items_meta` (
  `item_id` int(10) unsigned NOT NULL,
  `meta_id` smallint(5) unsigned NOT NULL,
  `value` int(11) NOT NULL,
  PRIMARY KEY (`item_id`,`meta_id`),
  KEY `meta_id` (`meta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_metas
# ------------------------------------------------------------

CREATE TABLE `items_metas` (
  `item_id` int(10) unsigned NOT NULL,
  `meta_id` smallint(5) unsigned NOT NULL,
  `content` varchar(512) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`item_id`,`meta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table items_pages
# ------------------------------------------------------------

CREATE TABLE `items_pages` (
  `item_id` int(10) unsigned NOT NULL,
  `page` tinyint(3) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`item_id`,`page`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_parsed_log
# ------------------------------------------------------------

CREATE TABLE `items_parsed_log` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `time_parsed` datetime DEFAULT NULL,
  `processed_time` decimal(7,3) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `item_id` (`item_id`),
  KEY `time_parsed` (`time_parsed`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_resolver
# ------------------------------------------------------------

CREATE TABLE `items_resolver` (
  `item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `normal_url` text COLLATE utf8_unicode_ci NOT NULL,
  `search_hash` varchar(42) CHARACTER SET latin1 DEFAULT NULL,
  `resolved_id` int(10) unsigned NOT NULL,
  `has_old_dupes` tinyint(1) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `search_hash` (`search_hash`(7)),
  KEY `resolved_id` (`resolved_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table items_to_resolve
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `lock_id` varchar(40) DEFAULT NULL,
  `time_inserted` datetime DEFAULT NULL,
  `time_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `lock_idx` (`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_backfill
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_backfill` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `lock_id` varchar(40) DEFAULT NULL,
  `time_inserted` datetime DEFAULT NULL,
  `time_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `lock_idx` (`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_old
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_old` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_old_2013_12_01
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_old_2013_12_01` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `time_inserted` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_old_can_be_deleted
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_old_can_be_deleted` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `lock_id` varchar(40) DEFAULT NULL,
  `time_inserted` datetime DEFAULT NULL,
  `time_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `lock_idx` (`lock_id`),
  KEY `item_lock_idx` (`item_id`,`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_test
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_test` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `lock_id` varchar(15) DEFAULT NULL,
  `time_inserted` datetime DEFAULT NULL,
  `time_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `lock_idx` (`lock_id`),
  KEY `item_lock_idx` (`item_id`,`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_test_asc
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_test_asc` (
  `inverted_item_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `lock_id` varchar(15) DEFAULT NULL,
  `time_inserted` datetime DEFAULT NULL,
  `time_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`inverted_item_id`),
  KEY `lock_idx` (`lock_id`),
  KEY `item_lock_idx` (`item_id`,`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_test_small
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_test_small` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  `lock_id` varchar(15) DEFAULT NULL,
  `time_inserted` datetime DEFAULT NULL,
  `time_locked` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `lock_idx` (`lock_id`),
  KEY `item_lock_idx` (`item_id`,`lock_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_to_resolve_tmp
# ------------------------------------------------------------

CREATE TABLE `items_to_resolve_tmp` (
  `item_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `refresh` tinyint(1) NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table items_urls
# ------------------------------------------------------------

CREATE TABLE `items_urls` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` int(10) unsigned NOT NULL,
  `url_type_id` smallint(5) unsigned NOT NULL,
  `url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url_type` (`item_id`,`url_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table items_videos
# ------------------------------------------------------------

CREATE TABLE `items_videos` (
  `item_id` int(10) unsigned NOT NULL,
  `video_id` tinyint(3) unsigned NOT NULL,
  `src` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `width` smallint(5) unsigned NOT NULL,
  `height` smallint(5) unsigned NOT NULL,
  `type` tinyint(3) unsigned NOT NULL,
  `vid` varchar(30) NOT NULL,
  `length` mediumint(8) unsigned DEFAULT NULL,
  `int_1` int(10) unsigned DEFAULT NULL,
  `int_2` int(10) unsigned DEFAULT NULL,
  `int_3` int(10) unsigned DEFAULT NULL,
  `chr_1` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `chr_2` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `chr_3` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`,`video_id`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;



# Dump of table meta_properties
# ------------------------------------------------------------

CREATE TABLE `meta_properties` (
  `meta_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`meta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table parser_backfill_temp
# ------------------------------------------------------------

CREATE TABLE `parser_backfill_temp` (
  `content_id` int(10) NOT NULL DEFAULT '0',
  `save_cnt` int(10) DEFAULT NULL,
  PRIMARY KEY (`content_id`),
  KEY `save_idx` (`save_cnt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table parser_blacklist
# ------------------------------------------------------------

CREATE TABLE `parser_blacklist` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `time_added` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table parser_error_log
# ------------------------------------------------------------

CREATE TABLE `parser_error_log` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entry` text COLLATE utf8_unicode_ci NOT NULL,
  `time_logged` datetime DEFAULT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table parser_rules
# ------------------------------------------------------------

CREATE TABLE `parser_rules` (
  `domain_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `property` varchar(75) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `rules` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `time_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`domain_id`,`property`),
  KEY `ix_time_updated` (`time_updated`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table parser_rules_domains
# ------------------------------------------------------------

CREATE TABLE `parser_rules_domains` (
  `domain_id` int(10) unsigned NOT NULL,
  `allow_top` tinyint(1) unsigned NOT NULL,
  PRIMARY KEY (`domain_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table parser_rules_staging
# ------------------------------------------------------------

CREATE TABLE `parser_rules_staging` (
  `domain_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `property` varchar(75) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `rules` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `time_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`domain_id`,`property`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table posted_items_stats
# ------------------------------------------------------------

CREATE TABLE `posted_items_stats` (
  `resolved_id` int(10) unsigned NOT NULL,
  `save_cnt` int(10) unsigned NOT NULL DEFAULT '0',
  `impact_score` decimal(7,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`resolved_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table posted_items_stats_old
# ------------------------------------------------------------

CREATE TABLE `posted_items_stats_old` (
  `resolved_id` int(10) unsigned NOT NULL,
  `save_cnt` int(10) unsigned NOT NULL DEFAULT '0',
  `impact_score` decimal(7,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`resolved_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table stats_camps
# ------------------------------------------------------------

CREATE TABLE `stats_camps` (
  `camp_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  PRIMARY KEY (`camp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table stats_errors
# ------------------------------------------------------------

CREATE TABLE `stats_errors` (
  `api_id` mediumint(8) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `time_happened` datetime NOT NULL,
  `log` text NOT NULL,
  KEY `api_id` (`user_id`,`api_id`),
  KEY `time_happened` (`time_happened`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table stats_guids
# ------------------------------------------------------------

CREATE TABLE `stats_guids` (
  `guid` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `api_id` mediumint(8) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`guid`),
  KEY `api_id` (`api_id`),
  KEY `user_id` (`user_id`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table stats_log
# ------------------------------------------------------------

CREATE TABLE `stats_log` (
  `camp_id` smallint(5) unsigned NOT NULL,
  `model_id` tinyint(3) unsigned NOT NULL,
  `version` tinyint(3) unsigned NOT NULL,
  `api_id` mediumint(8) unsigned NOT NULL,
  `stage` tinyint(3) unsigned NOT NULL,
  `guid` bigint(20) unsigned NOT NULL,
  `time_entered` datetime NOT NULL,
  KEY `camp_id` (`camp_id`,`model_id`,`version`,`api_id`,`stage`),
  KEY `guid_id` (`guid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table stats_models
# ------------------------------------------------------------

CREATE TABLE `stats_models` (
  `camp_id` smallint(5) unsigned NOT NULL,
  `model_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  PRIMARY KEY (`camp_id`,`model_id`),
  KEY `model_id` (`model_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table stats_stages
# ------------------------------------------------------------

CREATE TABLE `stats_stages` (
  `camp_id` smallint(5) unsigned NOT NULL,
  `stage_id` tinyint(3) unsigned NOT NULL,
  `name` varchar(40) NOT NULL,
  PRIMARY KEY (`camp_id`,`stage_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table stats_uuid_guid
# ------------------------------------------------------------

CREATE TABLE `stats_uuid_guid` (
  `uuid` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `guid` bigint(20) unsigned NOT NULL,
  `time_updated` int(10) unsigned NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `guid_idx` (`guid`),
  KEY `time_updated_idx` (`time_updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table topic_groupings
# ------------------------------------------------------------

CREATE TABLE `topic_groupings` (
  `grouping_topic_id` bigint(20) unsigned NOT NULL,
  `grouping_id` bigint(20) unsigned NOT NULL,
  `weight` decimal(21,20) unsigned NOT NULL DEFAULT '0.50000000000000000000',
  `is_general` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`grouping_topic_id`,`grouping_id`),
  KEY `grouping_idx` (`grouping_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table url_type
# ------------------------------------------------------------

CREATE TABLE `url_type` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_grouping_item
# ------------------------------------------------------------

CREATE TABLE `user_grouping_item` (
  `user_id` int(10) unsigned NOT NULL,
  `grouping_id` bigint(20) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `sort` decimal(21,20) unsigned DEFAULT '0.00000000000000000000',
  PRIMARY KEY (`user_id`,`grouping_id`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_grouping_item_raw
# ------------------------------------------------------------

CREATE TABLE `user_grouping_item_raw` (
  `user_id` int(10) unsigned NOT NULL,
  `grouping_id` bigint(20) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`grouping_id`,`item_id`),
  KEY `user_item_idx` (`user_id`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_grouping_score
# ------------------------------------------------------------

CREATE TABLE `user_grouping_score` (
  `user_id` int(10) unsigned NOT NULL,
  `grouping_id` bigint(20) unsigned NOT NULL,
  `item_count` smallint(5) unsigned DEFAULT '0',
  `score` decimal(21,20) unsigned DEFAULT '0.00000000000000000000',
  `weighted_score` decimal(21,20) unsigned DEFAULT '0.00000000000000000000',
  PRIMARY KEY (`user_id`,`grouping_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_grouping_stats
# ------------------------------------------------------------

CREATE TABLE `user_grouping_stats` (
  `user_id` int(10) unsigned NOT NULL,
  `grouping_id` bigint(20) unsigned NOT NULL,
  `overall_display_cnt` smallint(5) unsigned DEFAULT '0',
  `overall_open_cnt` smallint(5) unsigned DEFAULT '0',
  `overall_click_cnt` smallint(5) unsigned DEFAULT '0',
  `last_open_cnt` smallint(5) unsigned DEFAULT '0',
  `last_click_cnt` smallint(5) unsigned DEFAULT '0',
  PRIMARY KEY (`user_id`,`grouping_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_item_backfill_tracking
# ------------------------------------------------------------

CREATE TABLE `user_item_backfill_tracking` (
  `user_id` int(10) unsigned NOT NULL,
  `earliest_save_time_added` int(10) unsigned NOT NULL,
  `earliest_archive_time_added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_item_score
# ------------------------------------------------------------

CREATE TABLE `user_item_score` (
  `user_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `projected` decimal(21,20) unsigned DEFAULT '0.00000000000000000000',
  `actual` decimal(21,20) unsigned DEFAULT '0.00000000000000000000',
  PRIMARY KEY (`user_id`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table user_item_stats_test
# ------------------------------------------------------------

CREATE TABLE `user_item_stats_test` (
  `user_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `resolved_id` int(10) unsigned NOT NULL,
  `save_cnt` smallint(5) unsigned DEFAULT '0',
  `open_cnt` smallint(5) unsigned DEFAULT '0',
  `list_open_cnt` smallint(5) unsigned DEFAULT '0',
  `suggested_open_cnt` smallint(5) unsigned DEFAULT '0',
  `share_cnt` smallint(5) unsigned DEFAULT '0',
  `social_share_cnt` smallint(5) unsigned DEFAULT '0',
  `archive_share_cnt` smallint(5) unsigned DEFAULT '0',
  `friend_share_cnt` smallint(5) unsigned DEFAULT '0',
  `share_received_cnt` smallint(5) unsigned DEFAULT '0',
  `is_favorite` tinyint(3) unsigned DEFAULT '0',
  `is_archive` tinyint(3) unsigned DEFAULT '0',
  `is_currently_viewed` tinyint(3) unsigned DEFAULT '0',
  `first_saved_time` int(10) unsigned DEFAULT NULL,
  `first_opened_time` int(10) unsigned DEFAULT NULL,
  `last_update_time` int(10) unsigned DEFAULT NULL,
  `list_impression_cnt` smallint(5) unsigned DEFAULT '0',
  `suggested_impression_cnt` smallint(5) unsigned DEFAULT '0',
  `session_cnt` smallint(5) unsigned DEFAULT '0',
  `time_spent` int(10) unsigned DEFAULT NULL,
  `status` tinyint(3) unsigned DEFAULT '0',
  PRIMARY KEY (`user_id`,`item_id`),
  KEY `user_resolved_idx` (`user_id`,`resolved_id`),
  KEY `resolved_idx` (`resolved_id`),
  KEY `user_status_idx` (`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE  `domain_business_metadata` (
  id int(10) unsigned NOT NULL auto_increment,
  created_at datetime,
  updated_at datetime,
  name varchar(255) DEFAULT NULL ,
  legal_name varchar(255) DEFAULT NULL,
  logo_path varchar(255)  DEFAULT NULL,
  greyscale_logo_path varchar(255)  DEFAULT NULL,
  pocket_override tinyint(1) DEFAULT 0,
  domain_name varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `clearbit_data` (
  id int(10) unsigned NOT NULL auto_increment,
  clearbit_id varchar(255) NOT NULL,
  created_at datetime,
  updated_at datetime,
  data blob NOT NULL,
  domain_name varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE INDEX domain_business_metadata_domain_name_index ON domain_business_metadata (domain_name);
CREATE INDEX clearbit_data_domain_name_index ON clearbit_data (domain_name);

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
