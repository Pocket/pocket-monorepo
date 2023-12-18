CREATE USER 'pkt_shares'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT ALL ON readitla_shares.* TO 'pkt_shares'@'%';
