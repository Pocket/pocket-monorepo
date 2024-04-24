USE readitla_cache;

REPLACE INTO cache_type (cache_type_id, name)
VALUES
       (1, 'Rediscovery Groups'),
       (2, 'Rediscovery Highlights'),
       (3, 'Rediscovery Carousel'),
       (4, 'Preferences API');

REPLACE INTO library_collections (collection_id, item_id, resolved_id, time_created, web_cache_path, text_cache_path)
VALUES
       (196123140,1460779530,1460779530,'2016-11-03 07:03:18','/nytimes.com/d09f813ce35f62b4a7672ebdc052dd7b023cb894.html','/nytimes.com/e2014302bbebdd111844751bc5ed4438b837b679.json');

REPLACE INTO library_collection_users (collection_id, user_id, item_id, resolved_id, assigned_time)
VALUES
       (196123140,24060899,1460779530,1460779530,'2018-11-06 14:00:00');
