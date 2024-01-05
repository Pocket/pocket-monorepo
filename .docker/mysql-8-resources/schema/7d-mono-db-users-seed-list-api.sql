CREATE USER 'pkt_listapi_r'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER 'pkt_listapi_w'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT, CREATE TEMPORARY TABLES ON `readitla_ril-tmp`.* TO pkt_listapi_r@'%';
GRANT SELECT, CREATE TEMPORARY TABLES ON `readitla_b`.* TO pkt_listapi_r@'%';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES ON `readitla_ril-tmp`.* TO pkt_listapi_w@'%';

# Granted only for testing.
GRANT DROP ON `readitla_ril-tmp`.* TO 'pkt_listapi_w'@'%';
GRANT DROP ON readitla_b.* TO 'pkt_listapi_w'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES ON `readitla_b`.* TO pkt_listapi_w@'%';
