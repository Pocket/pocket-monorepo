CREATE USER 'pkt_accdelapi_r'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER 'pkt_accdelapi_w'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT, DELETE ON `readitla_ril-tmp`.* TO pkt_accdelapi_w@'%';
GRANT SELECT, DELETE ON `readitla_b`.* TO pkt_accdelapi_w@'%';
GRANT SELECT, DELETE ON `readitla_auth`.* TO pkt_accdelapi_w@'%';
GRANT SELECT, DELETE ON `readitla_analytics`.* TO pkt_accdelapi_w@'%';

GRANT SELECT, CREATE TEMPORARY TABLES ON `readitla_ril-tmp`.* TO pkt_accdelapi_r@'%';
GRANT SELECT, CREATE TEMPORARY TABLES ON `readitla_b`.* TO pkt_accdelapi_r@'%';
GRANT SELECT, CREATE TEMPORARY TABLES ON `readitla_auth`.* TO pkt_accdelapi_r@'%';
GRANT SELECT, CREATE TEMPORARY TABLES ON `readitla_analytics`.* TO pkt_accdelapi_r@'%';


# Granted only for testing.
GRANT DROP, INSERT ON `readitla_ril-tmp`.* TO 'pkt_accdelapi_w'@'%';
GRANT DROP, INSERT ON readitla_b.* TO 'pkt_accdelapi_w'@'%';
GRANT DROP, INSERT ON readitla_auth.* TO 'pkt_accdelapi_w'@'%';
GRANT DROP, INSERT ON readitla_analytics.* TO 'pkt_accdelapi_w'@'%';
