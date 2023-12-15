CREATE DATABASE IF NOT EXISTS `readitla_logs`;

USE `readitla_logs`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table api_calls
# ------------------------------------------------------------

CREATE TABLE `api_calls` (
  `api_id` mediumint(8) unsigned NOT NULL,
  `endpoint` varchar(25) NOT NULL,
  `time` datetime NOT NULL,
  `count` mediumint(8) unsigned NOT NULL,
  PRIMARY KEY (`api_id`,`endpoint`,`time`),
  KEY `time` (`time`,`api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table api_use
# ------------------------------------------------------------

CREATE TABLE `api_use` (
   `api_id` MEDIUMINT(8) UNSIGNED NOT NULL,
   `endpoint` VARCHAR(25) NOT NULL,
   `time` DATETIME NOT NULL,
   `count` MEDIUMINT(8) UNSIGNED NOT NULL
) ENGINE=MyISAM;



# Dump of table oauth_api_calls
# ------------------------------------------------------------

CREATE TABLE `oauth_api_calls` (
  `consumer_key` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `endpoint` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `time` datetime NOT NULL,
  `count` mediumint(8) unsigned NOT NULL,
  PRIMARY KEY (`consumer_key`,`endpoint`,`time`),
  KEY `time` (`time`,`consumer_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;





# Replace placeholder table for api_use with correct view syntax
# ------------------------------------------------------------

DROP TABLE `api_use`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `api_use`
AS SELECT
   `api_calls`.`api_id` AS `api_id`,
   `api_calls`.`endpoint` AS `endpoint`,
   `api_calls`.`time` AS `time`,
   `api_calls`.`count` AS `count`
FROM `api_calls` where (`api_calls`.`api_id` >= 100) order by `api_calls`.`time` desc;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
