CREATE DATABASE IF NOT EXISTS `readitla_analytics`;

USE `readitla_analytics`;

-- email_lists: table
CREATE TABLE `email_lists`
(
    `id`         int(11)   NOT NULL AUTO_INCREMENT,
    `table_name` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci                DEFAULT NULL,
    `user_count` int(11)   NOT NULL                                                     DEFAULT '0',
    `email_type` enum ('ph','manual','test') CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT 'manual',
    `status`     enum ('live','removed') CHARACTER SET utf8 COLLATE utf8_unicode_ci     DEFAULT 'live',
    `added_at`   timestamp NOT NULL                                                     DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL                                                     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `name_idx` (`table_name`),
    KEY `status_idx` (`status`, `email_type`, `added_at`),
    KEY `type_idx` (`email_type`, `added_at`, `status`),
    KEY `added_idx` (`added_at`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;
