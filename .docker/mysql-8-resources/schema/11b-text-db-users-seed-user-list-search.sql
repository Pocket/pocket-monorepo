CREATE USER IF NOT EXISTS 'pkt_listserch_r'@'%' IDENTIFIED WITH mysql_native_password BY '';


GRANT SELECT ON `content_cache`.`cache_even` TO pkt_listserch_r@'%';
GRANT SELECT ON `content_cache`.`cache_odd` TO pkt_listserch_r@'%';
GRANT SELECT ON `content`.`content` TO pkt_listserch_r@'%';


# Granted only for testing.
GRANT INSERT, DROP ON content_cache.* TO pkt_listserch_r@'%';
GRANT INSERT, DROP ON content.* TO pkt_listserch_r@'%';
