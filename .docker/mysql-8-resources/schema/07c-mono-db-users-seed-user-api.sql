CREATE USER 'pkt_userapi_r'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER 'pkt_userapi_w'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT ON `readitla_ril-tmp`.* TO pkt_userapi_r@'%';
GRANT SELECT ON `readitla_auth`.`user_providers` TO pkt_userapi_r@'%';
GRANT SELECT ON `readitla_auth`.`users` TO pkt_userapi_r@'%';


GRANT SELECT, INSERT, UPDATE, DELETE ON `readitla_ril-tmp`.* TO pkt_userapi_w@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `readitla_auth`.`user_providers` TO pkt_userapi_w@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `readitla_auth`.`users` TO pkt_userapi_w@'%';

# Granted only for testing.
GRANT DROP ON `readitla_ril-tmp`.* TO 'pkt_userapi_w'@'%';
GRANT DROP ON readitla_b.* TO 'pkt_userapi_w'@'%';
GRANT DROP ON `readitla_auth`.* TO 'pkt_userapi_w'@'%';
