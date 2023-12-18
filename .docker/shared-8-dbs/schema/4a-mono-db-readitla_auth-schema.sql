CREATE DATABASE IF NOT EXISTS `readitla_auth`;

USE `readitla_auth`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS = @@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION = @@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES = @@SQL_NOTES, SQL_NOTES = 0 */;



CREATE TABLE `users`
(
  `id`              int(11)                                            NOT NULL AUTO_INCREMENT,
  `created_at`      timestamp                                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp                                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `external_key`    char(10) CHARACTER SET latin1 COLLATE latin1_bin NOT NULL,
  `name`            varchar(150)                                       NOT NULL,
  `public_identity` varchar(20)                                        NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE `external_key_idx` (`external_key`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `providers`
(
  `id`         int(11)                                                        NOT NULL AUTO_INCREMENT,
  `created_at` timestamp                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type`       enum ('apple', 'google', 'firefox', 'pocket', 'mozilla-auth0') NOT NULL,
  `name`       varchar(50)                                                    NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;


CREATE TABLE `user_providers`
(
  `id`               int(11)      NOT NULL AUTO_INCREMENT,
  `created_at`       timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id`          int(11)      NOT NULL,
  `provider_id`      int(11)      NOT NULL,
  `provider_user_id` MEDIUMTEXT   NOT NULL,
  `refresh_token`    MEDIUMTEXT   NOT NULL,
  `provider_data`    BLOB         NOT NULL,
  `email`            varchar(150) NOT NULL,
  UNIQUE `user_provider_index` (`user_id`, `provider_id`),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
