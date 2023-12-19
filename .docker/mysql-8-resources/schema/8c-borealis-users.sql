CREATE USER 'pkt_savecount'@'%' IDENTIFIED WITH mysql_native_password BY '';

GRANT ALL ON borealis.* TO 'pkt_savecount'@'%';