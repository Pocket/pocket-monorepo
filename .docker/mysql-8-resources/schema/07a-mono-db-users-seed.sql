CREATE USER 'pkt_readonly'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER 'pkt_write'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER 'pkt_permlib'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT,CREATE TEMPORARY TABLES ON `readitla_ril-tmp`.* TO 'pkt_readonly'@'%';
GRANT ALL ON `readitla_ril-tmp`.* TO 'pkt_write'@'%';
GRANT SELECT,CREATE TEMPORARY TABLES ON readitla_b.* TO 'pkt_readonly'@'%';
GRANT ALL ON readitla_b.* TO 'pkt_write'@'%';
GRANT SELECT,CREATE TEMPORARY TABLES ON readitla_logs.* TO 'pkt_readonly'@'%';
GRANT ALL ON readitla_logs.* TO 'pkt_write'@'%';
GRANT SELECT,CREATE TEMPORARY TABLES ON readitla_auth.* TO 'pkt_readonly'@'%';
GRANT ALL ON readitla_auth.* TO 'pkt_write'@'%';
GRANT SELECT,CREATE TEMPORARY TABLES ON readitla_analytics.* TO 'pkt_readonly'@'%';
GRANT ALL ON readitla_analytics.* TO 'pkt_write'@'%';
GRANT ALL ON readitla_cache.* TO 'pkt_permlib'@'%';
