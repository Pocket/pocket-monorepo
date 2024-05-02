USE `borealis`;

REPLACE INTO item_saves (item_id, save_count_all, save_count_whitelisted, resolved_id) VALUES (1, 1, 1, 2);

REPLACE INTO resolved_saves (resolved_id, save_count_all, save_count_whitelisted) VALUES
(2, 147, 131),
(3, 1000, 1000),
(772045939, 328, 480),
(1514732753, 100, 100),
(1748259901, 100, 100),
(1808422207, 100, 100);
