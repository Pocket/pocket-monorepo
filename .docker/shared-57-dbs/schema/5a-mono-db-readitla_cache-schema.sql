CREATE DATABASE IF NOT EXISTS readitla_cache;

USE readitla_cache;

create table cache_type
(
  cache_type_id smallint(5) unsigned auto_increment
    primary key,
  name          varchar(30) collate utf8_unicode_ci not null
)
charset = utf8;

create table library_assets
(
  asset_id      bigint unsigned auto_increment
    primary key,
  file_type     tinyint(1) unsigned          not null,
  url           text collate utf8_unicode_ci not null,
  cache_path    varchar(255)                 not null,
  file_checksum varchar(42) charset latin1   null
)
charset = utf8;

create index file_checksum
  on library_assets (file_checksum);

create table library_collection_assets
(
  collection_id bigint unsigned not null,
  asset_id      bigint unsigned not null,
  primary key (collection_id, asset_id)
)
charset = utf8;

create index asset_id
  on library_collection_assets (asset_id);

create table library_collection_users
(
  collection_id bigint unsigned not null,
  user_id       int unsigned    not null,
  item_id       int unsigned    not null,
  resolved_id   int unsigned    not null,
  assigned_time datetime        not null,
  primary key (user_id, item_id, collection_id)
)
charset = utf8;

create index collection_id
  on library_collection_users (collection_id);

create index resolved_id
  on library_collection_users (resolved_id);

create table library_collections
(
  collection_id   bigint unsigned auto_increment
    primary key,
  item_id         int unsigned not null,
  resolved_id     int unsigned not null,
  time_created    datetime     not null,
  web_cache_path  varchar(255) not null,
  text_cache_path varchar(255) not null
)
charset = utf8;

create index item_id
  on library_collections (item_id);

create index resolved_id
  on library_collections (resolved_id);

create table library_log
(
  log_id                           bigint unsigned auto_increment
    primary key,
  user_id                          int unsigned           not null,
  item_id                          int unsigned           not null,
  resolved_id                      int unsigned           not null,
  assigned_to_collection_id        bigint unsigned        not null,
  process_type                     tinyint unsigned       not null,
  time_taken                       decimal(5, 2) unsigned not null,
  time_processed                   datetime               not null,
  success                          tinyint unsigned       not null,
  n_assets                         smallint(5) unsigned   not null,
  n_assets_memcache_hit            smallint(5) unsigned   not null,
  time_fetchMarkup                 decimal(5, 2) unsigned not null,
  time_linkRewrite                 decimal(5, 2) unsigned not null,
  time_requestDownloadAssets       decimal(5, 2) unsigned not null,
  time_requestDownloadUploadAssets decimal(5, 2) unsigned not null,
  time_articleView                 decimal(5, 2) unsigned not null,
  time_saveDB                      decimal(5, 2) unsigned not null
)
charset = utf8;

create index item_id
  on library_log (item_id);

create index resolved_id
  on library_log (resolved_id);

create index time_processed
  on library_log (time_processed);

create index user_item
  on library_log (user_id, item_id);

create table library_scripts
(
  collection_id bigint unsigned not null,
  item_id       int unsigned    not null,
  script        varchar(255)    not null
)
charset = utf8;

create index collection_id
  on library_scripts (script);

create table user_cache
(
  user_id          int unsigned                 not null,
  cache_type_id    smallint(5) unsigned         not null,
  format           char                         null,
  cache_value      text collate utf8_unicode_ci null,
  last_update_time int unsigned                 null,
  primary key (user_id, cache_type_id)
)
charset = utf8;

CREATE TABLE `user_last_item_log`
(
  `id`                 int(10)          NOT NULL AUTO_INCREMENT,
  `user_id`            int(10) unsigned NOT NULL,
  `last_item_saved_at` datetime         NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_last_item_log_user_id_IDX` (`user_id`) USING BTREE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;
