CREATE DATABASE IF NOT EXISTS `readitla_ril-tmp`;

USE `readitla_ril-tmp`;
--  The same schema as list, except uses expanded types for item_id and resolved_id.
create table list_schema_update
(
    user_id        int unsigned               not null,
    item_id        bigint unsigned            not null,
    resolved_id    bigint unsigned            not null,
    given_url      text                       not null,
    title          varchar(75)                not null,
    time_added     datetime                   not null,
    time_updated   datetime                   not null,
    time_read      datetime                   not null,
    time_favorited datetime                   not null,
    api_id         mediumint unsigned         not null,
    status         tinyint unsigned           not null,
    favorite       tinyint unsigned default 0 not null,
    api_id_updated mediumint unsigned         not null,
    primary key (user_id, item_id)
)
    collate = utf8_unicode_ci;

--  Also create indices, so as to keep them updated while backfilling.
--  After backfilling, we will rename these indices.
--  Note: MySQL 5.7 supports renaming indices without rebuilding tables/indices:
--       https://dev.mysql.com/doc/refman/5.7/en/innodb-online-ddl-operations.html#online-ddl-index-operations
create index api_id_schema_update
    on list_schema_update (api_id);

create index api_id_updated_schema_update
    on list_schema_update (api_id_updated);

create index item_id_schema_update
    on list_schema_update (item_id);

create index resolved_id_schema_update
    on list_schema_update (resolved_id);

create index time_added_schema_update
    on list_schema_update (time_added);

create index time_updated_schema_update
    on list_schema_update (time_updated);

create index userStatusTime_schema_update
    on list_schema_update (user_id, status, time_updated);

create index userTimeAdded_schema_update
    on list_schema_update (user_id, status, time_added);

create index userTimeFavorited_schema_update
    on list_schema_update (user_id, favorite, time_favorited);

create index userTimeRead_schema_update
    on list_schema_update (user_id, status, time_read);

create index user_id_schema_update
    on list_schema_update (user_id, status, item_id);