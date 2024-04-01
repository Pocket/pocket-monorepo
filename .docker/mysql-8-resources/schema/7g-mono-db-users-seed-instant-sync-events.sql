CREATE USER IF NOT EXISTS 'pkt_inssync_r'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT ON `readitla_ril-tmp`.push_tokens TO pkt_inssync_r@'%';
GRANT SELECT ON `readitla_ril-tmp`.users_tokens TO pkt_inssync_r@'%';

CREATE USER IF NOT EXISTS 'pkt_inssync_w'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT, INSERT, UPDATE, DELETE, DROP ON `readitla_ril-tmp`.push_tokens TO pkt_inssync_w@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, DROP ON `readitla_ril-tmp`.users_tokens TO pkt_inssync_w@'%';
