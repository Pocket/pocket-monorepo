CREATE DATABASE IF NOT EXISTS `readitla_shares`;

USE `readitla_shares`;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# Dump of table share_urls
# ------------------------------------------------------------

CREATE TABLE `share_urls` (
  `share_url_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `resolved_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `api_id` mediumint(8) unsigned NOT NULL,
  `service_id` smallint(5) NOT NULL,
  `time_generated` int(10) NOT NULL,
  `time_shared` int(10) NOT NULL,
  PRIMARY KEY (`share_url_id`),
  KEY `user_idx` (`user_id`),
  KEY `item_idx` (`item_id`),
  KEY `api_idx` (`api_id`),
  KEY `service_idx` (`service_id`),
  KEY `generated_idx` (`time_generated`),
  KEY `shared_idx` (`time_shared`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


# Dump of table blacklisted_share_urls
# ------------------------------------------------------------

CREATE TABLE `blacklisted_share_urls` (
  `share_url_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL,
  `resolved_id` int(10) unsigned NOT NULL,
  `given_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `api_id` mediumint(8) unsigned NOT NULL,
  `service_id` smallint(5) NOT NULL,
  `time_generated` int(10) NOT NULL,
  `time_shared` int(10) NOT NULL,
  PRIMARY KEY (`share_url_id`),
  KEY `user_idx` (`user_id`),
  KEY `item_idx` (`item_id`),
  KEY `api_idx` (`api_id`),
  KEY `service_idx` (`service_id`),
  KEY `generated_idx` (`time_generated`),
  KEY `shared_idx` (`time_shared`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table share_urls_log
# ------------------------------------------------------------

CREATE TABLE `share_urls_log` (
  `share_urls_log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `share_url_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `time_visited` int(10) NOT NULL,
  `referrer` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `user_agent` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`share_urls_log_id`),
  KEY `share_url_id` (`share_url_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
