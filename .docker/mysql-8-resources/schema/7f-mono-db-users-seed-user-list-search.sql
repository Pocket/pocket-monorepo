CREATE USER IF NOT EXISTS 'pkt_listserch_r'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER IF NOT EXISTS 'pkt_listserch_w'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT ON `readitla_ril-tmp`.`users` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_ril-tmp`.`list` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_ril-tmp`.`item_tags` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_ril-tmp`.`user_recent_search` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_b`.`items_resolver` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_b`.`items_extended` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_b`.`items_authors` TO pkt_listserch_r@'%';
GRANT SELECT ON `readitla_b`.`authors` TO pkt_listserch_r@'%';


# Granted only for testing.
GRANT SELECT, DROP, INSERT, UPDATE ON `readitla_ril-tmp`.* TO 'pkt_listserch_r'@'%';
GRANT SELECT, DROP, INSERT, UPDATE ON readitla_b.* TO 'pkt_listserch_r'@'%';
GRANT SELECT, DROP, INSERT, UPDATE ON readitla_auth.* TO 'pkt_listserch_r'@'%';
GRANT SELECT, DROP, INSERT, UPDATE ON readitla_analytics.* TO 'pkt_listserch_r'@'%';

# Writer
GRANT SELECT, DROP, INSERT, UPDATE ON `readitla_ril-tmp`.`user_recent_search` TO 'pkt_listserch_r'@'%';
