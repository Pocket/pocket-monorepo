CREATE USER 'pkt_annotapi_r'@'%' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER 'pkt_annotapi_w'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT SELECT ON `readitla_ril-tmp`.* TO 'pkt_annotapi_r'@'%';
GRANT SELECT ON readitla_b.* TO 'pkt_annotapi_r'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `readitla_ril-tmp`.* TO 'pkt_annotapi_w'@'%';

# Granted only for testing.
GRANT DROP ON `readitla_ril-tmp`.* TO 'pkt_annotapi_w'@'%';
GRANT DROP ON readitla_b.* TO 'pkt_annotapi_w'@'%';
