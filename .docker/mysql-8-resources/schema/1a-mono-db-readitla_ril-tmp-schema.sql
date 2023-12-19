CREATE DATABASE IF NOT EXISTS `readitla_ril-tmp`;

USE `readitla_ril-tmp`;

SET GLOBAL explicit_defaults_for_timestamp = 0;

create table ab_test_assign
(
    user_key          bigint unsigned   not null,
    user_key_type_id  tinyint default 0 null,
    ab_test_id        int               not null,
    ab_test_option_id int               not null,
    time_created      int               not null,
    constraint user_ab
        unique (user_key, user_key_type_id, ab_test_id)
);

create table ab_test_options
(
    id          int auto_increment
        primary key,
    ab_test_id  int                not null,
    name        varchar(40)        not null,
    weight      smallint default 1 null,
    value_shown blob               null,
    view_cnt    int      default 0 null
)
    collate = utf8_unicode_ci;

create index ab_test_idx
    on ab_test_options (ab_test_id);

create table ab_test_type
(
    id   tinyint     not null
        primary key,
    name varchar(30) null
);

create table ab_test_user_accounts
(
    user_id int unsigned not null
        primary key
);

create table ab_tests
(
    id              int auto_increment
        primary key,
    name            varchar(50)        not null,
    ab_test_type_id tinyint  default 0 null,
    population_pct  smallint default 0 null,
    time_created    int                not null,
    active          tinyint  default 0 null
)
    collate = utf8_unicode_ci;

create index active_idx
    on ab_tests (active);

create index name_idx
    on ab_tests (name);

create index type_idx
    on ab_tests (ab_test_type_id, active);

create table acl_rules
(
    user_id    int unsigned                                     not null,
    role       varchar(255)                                     not null,
    permission varchar(128)                                     not null,
    created_at timestamp              default CURRENT_TIMESTAMP not null,
    updated_at timestamp              default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    expires_at timestamp                                        null,
    type       enum ('allow', 'deny') default 'allow'           null,
    constraint rule_idx
        unique (user_id, role, permission)
)
    collate = utf8_unicode_ci;

create index role_idx
    on acl_rules (role);

create table action_type
(
    action_type_id smallint unsigned not null
        primary key,
    name           varchar(35)       not null
)
    collate = utf8_unicode_ci;

create table activitystream_log
(
    activitystream_log_id bigint auto_increment
        primary key,
    start_dt              int unsigned      null,
    end_dt                int unsigned      null,
    endpoint_id           int unsigned      null,
    count                 smallint unsigned null,
    http_code             smallint unsigned null,
    request_size          int unsigned      null,
    total_time            float             null,
    size_upload           float             null
)
    collate = utf8_unicode_ci;

create table ad
(
    ad_id                 int unsigned auto_increment
        primary key,
    ad_source_id          smallint unsigned           not null,
    campaign_id           varchar(50)                 null,
    creative_id           varchar(50)                 null,
    adsnative_campaign_id int unsigned      default 0 null,
    adsnative_creative_id int unsigned      default 0 null,
    time_added            int unsigned      default 0 null,
    post_id               int unsigned                not null,
    resolved_id           int unsigned                not null,
    advertiser_id         int unsigned                not null,
    is_live               smallint unsigned default 0 null,
    is_inhouse            smallint unsigned default 0 null,
    constraint campaign_creative_idx
        unique (ad_source_id, campaign_id, creative_id)
)
    collate = utf8_unicode_ci;

create index adsnative_campaign_creative_idx
    on ad (ad_source_id, adsnative_campaign_id, adsnative_creative_id);

create index advertiser_idx
    on ad (advertiser_id);

create index post_idx
    on ad (post_id);

create index resolved_idx
    on ad (resolved_id);

create table ad_api_track
(
    user_id     int unsigned                           not null,
    api_id      mediumint unsigned                     not null,
    ad_count    smallint unsigned                      not null,
    time_viewed int unsigned default 0                 null,
    updated_at  timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, api_id)
)
    charset = utf8;

create index updated_at
    on ad_api_track (updated_at);

create table ad_report
(
    ad_report_id bigint unsigned auto_increment
        primary key,
    user_id      int unsigned      default 0 null,
    ad_id        int unsigned                not null,
    reason_id    smallint unsigned default 0 null,
    time_added   int unsigned      default 0 null,
    constraint user_ad_idx
        unique (user_id, ad_id)
)
    collate = utf8_unicode_ci;

create table ad_source
(
    ad_source_id int unsigned auto_increment
        primary key,
    name         varchar(50) null
)
    collate = utf8_unicode_ci;

create table admin_acl
(
    user_id    int unsigned not null,
    context    varchar(128) not null,
    role       varchar(64)  not null,
    expires_at timestamp    null,
    primary key (user_id, context, role)
)
    collate = utf8_unicode_ci;

create table admin_roles
(
    id   int unsigned auto_increment
        primary key,
    role varchar(255) not null,
    constraint role_idx
        unique (role)
)
    collate = utf8_unicode_ci;

create table admin_roles_users
(
    role_id    int unsigned                               not null,
    user_id    int unsigned                               not null,
    permission varchar(128)                               not null,
    type       tinyint unsigned default 0                 not null,
    created_at timestamp        default CURRENT_TIMESTAMP null,
    updated_at timestamp        default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    expires_at timestamp                                  null,
    primary key (role_id, user_id, permission)
)
    collate = utf8_unicode_ci;

create index user_idx
    on admin_roles_users (user_id);

create table admin_users
(
    user_id     int unsigned auto_increment
        primary key,
    pkt_user_id int unsigned     default 0                 not null,
    ldap_id     varchar(255)                               not null,
    created_at  timestamp        default CURRENT_TIMESTAMP null,
    updated_at  timestamp        default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    expires_at  timestamp                                  null,
    status      tinyint unsigned default 0                 not null,
    fname       varchar(128)                               null,
    lname       varchar(128)                               null,
    constraint ldap_id_idx
        unique (ldap_id)
);

create table advertiser
(
    advertiser_id int unsigned auto_increment
        primary key,
    name          varchar(50)            null,
    user_id       int unsigned           not null,
    time_added    int unsigned default 0 null
)
    collate = utf8_unicode_ci;

create index name_idx
    on advertiser (name);

create index user_idx
    on advertiser (user_id);

create table analytics_gsf_event_id_x
(
    event_id_x mediumint unsigned auto_increment
        primary key,
    section    varchar(255) null,
    view       varchar(255) null,
    event      varchar(255) null,
    constraint section
        unique (section, view, event)
)
    collate = utf8_unicode_ci;

create table android_store_check
(
    store_hard      varchar(255) not null,
    store_detect    varchar(255) not null,
    full_user_agent text         not null,
    time_added      int unsigned not null
)
    collate = utf8_unicode_ci;

create index store_hard_idx
    on android_store_check (store_hard);

create table android_transaction_log
(
    log_id         bigint unsigned auto_increment
        primary key,
    user_id        int unsigned                  not null,
    order_id       varchar(255) collate utf8_bin not null,
    package_name   varchar(255) collate utf8_bin not null,
    product_id     varchar(255) collate utf8_bin not null,
    purchase_token varchar(255) collate utf8_bin not null,
    purchase_state tinyint unsigned default 0    null,
    purchase_date  int unsigned                  not null,
    expire_date    int unsigned                  not null,
    line_item_type varchar(40)                   not null,
    time_added     int unsigned                  not null,
    livemode       tinyint unsigned default 0    null
)
    collate = utf8_unicode_ci;

create index order_idx
    on android_transaction_log (order_id);

create index user_idx
    on android_transaction_log (user_id, livemode);

create table api_actions
(
    action varchar(35) not null
        primary key,
    `desc` text        not null
);

create table api_actions_groups
(
    group_id tinyint(3) default 0 not null,
    sort_id  tinyint(3)           null,
    action   varchar(35)          not null,
    primary key (group_id, action)
);

create table api_actions_parameters
(
    action    varchar(35) not null,
    parameter varchar(35) not null,
    optional  tinyint(1)  null,
    primary key (action, parameter)
);

create table api_app_users
(
    user_id         int unsigned                        not null,
    api_id          mediumint unsigned                  not null,
    app_unique_id   varchar(50)                         not null,
    last_login      datetime                            not null,
    locale          varchar(5)                          not null,
    country         varchar(2)                          not null,
    timezone_offset smallint                            not null,
    updated_at      timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, api_id, app_unique_id)
);

create index api_user_id
    on api_app_users (api_id);

create index app_unique_id
    on api_app_users (app_unique_id);

create index country
    on api_app_users (country);

create index last_login
    on api_app_users (last_login);

create index timezone_offset
    on api_app_users (timezone_offset);

create index updated_at
    on api_app_users (updated_at);

create table api_category_assignment
(
    consumer_key varchar(30)                 not null,
    category_id  smallint unsigned           not null,
    sort         decimal(12, 2) default 0.00 null,
    primary key (consumer_key, category_id)
)
    collate = utf8_unicode_ci;

create table api_domains
(
    id         mediumint unsigned auto_increment
        primary key,
    api_id     mediumint unsigned                  not null,
    domain     varchar(255)                        not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    charset = utf8mb4;

create index api_id
    on api_domains (api_id);

create table api_groups
(
    group_id tinyint(3) default 0 not null
        primary key,
    name     varchar(35)          not null
);

create table api_keys
(
    api_id        mediumint unsigned          not null,
    consumer_key  varchar(30)                 not null,
    name          varchar(50)                 null,
    description   varchar(255)                null,
    app_url       text                        null,
    platform_id   smallint unsigned default 0 null,
    slug          varchar(15)                 null,
    permission    varchar(3)                  null,
    is_native     tinyint           default 0 null,
    allow_migrate tinyint           default 0 null,
    status        tinyint           default 0 null,
    time_created  datetime                    not null,
    time_updated  datetime                    not null,
    id            int unsigned auto_increment
        primary key
)
    collate = utf8_unicode_ci;

create index api_idx
    on api_keys (api_id, status);

create index consumer_key_idx
    on api_keys (consumer_key);

create index slug_idx
    on api_keys (slug);

create table api_parameters
(
    parameter varchar(35) not null
        primary key,
    `desc`    text        not null
);

create table api_platform
(
    platform_id smallint unsigned not null
        primary key,
    name        varchar(50)       null
)
    collate = utf8_unicode_ci;

create table api_users
(
    api_id        mediumint unsigned auto_increment
        primary key,
    name          varchar(50)                            not null,
    website       varchar(255)                           not null,
    via_domain    varchar(255) collate utf8_unicode_ci   not null,
    platform      varchar(75)                            not null,
    email         varchar(255)                           not null,
    apikey        varchar(32)                            not null,
    status        tinyint                                not null,
    time_created  datetime                               not null,
    is_native     tinyint      default 0                 null,
    is_trusted    tinyint      default 0                 null,
    permission    varchar(3)                             null,
    allow_reverse tinyint      default 0                 null,
    user_id       int unsigned default 0                 not null,
    updated_at    timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index name
    on api_users (name);

create index updated_at
    on api_users (updated_at);

create index user_idx
    on api_users (user_id);

create index via_domain
    on api_users (via_domain);

create table app_segment
(
    id             bigint auto_increment
        primary key,
    app_segment_id int unsigned       not null,
    guid           bigint unsigned    not null,
    user_id        bigint unsigned    not null,
    api_id         mediumint unsigned not null,
    app_session_id int unsigned       not null,
    start_time     datetime           not null,
    end_time       datetime           null,
    seconds        int unsigned       null,
    constraint app_segment_guid
        unique (app_segment_id, guid)
)
    collate = utf8_unicode_ci;

create index api_id
    on app_segment (api_id);

create index app_session_id
    on app_segment (app_session_id);

create index end_time
    on app_segment (end_time);

create index guid
    on app_segment (guid);

create index seconds
    on app_segment (seconds);

create index start_time
    on app_segment (start_time);

create index user_id
    on app_segment (user_id);

create table app_session
(
    id             bigint auto_increment
        primary key,
    app_session_id int unsigned       not null,
    guid           bigint unsigned    not null,
    user_id        bigint unsigned    not null,
    api_id         mediumint unsigned not null,
    start_time     datetime           not null,
    end_time       datetime           null,
    seconds        int unsigned       null,
    constraint app_session_guid
        unique (app_session_id, guid)
)
    collate = utf8_unicode_ci;

create index api_id
    on app_session (api_id);

create index end_time
    on app_session (end_time);

create index guid
    on app_session (guid);

create index seconds
    on app_session (seconds);

create index start_time
    on app_session (start_time);

create index user_id
    on app_session (user_id);

create table apps
(
    api_id        varchar(8)         not null
        primary key,
    api_id_shared mediumint unsigned not null,
    name          text               not null,
    slug          varchar(25)        not null,
    download_url  text               not null,
    type          text               not null,
    `desc`        text               not null,
    desc_ril      text               not null,
    status        tinyint unsigned   not null
)
    collate = utf8_unicode_ci;

create index slug
    on apps (slug);

create index status
    on apps (status);

create table apps_cats
(
    cat_id   tinyint unsigned auto_increment
        primary key,
    main_cat tinyint unsigned not null,
    name     varchar(35)      not null,
    slug     varchar(30)      not null,
    sort     tinyint          not null
)
    collate = utf8_unicode_ci;

create table apps_cats_assignments
(
    api_id varchar(8)       not null,
    cat_id tinyint unsigned not null,
    sort   decimal(12, 2)   not null,
    primary key (cat_id, api_id)
)
    collate = utf8_unicode_ci;

create table attribution_type
(
    id   int unsigned auto_increment
        primary key,
    name varchar(50) not null
)
    collate = utf8_unicode_ci;

create table authors
(
    author_id int unsigned auto_increment
        primary key,
    author    varchar(100) collate utf8_unicode_ci not null
);

create index domain
    on authors (author);

create table beta3_user
(
    feed_id varchar(20) not null
        primary key
);

create table botnet_ip
(
    id         int auto_increment
        primary key,
    ip         varchar(50) collate utf8_unicode_ci not null,
    time_added int                                 not null,
    constraint ip_idx
        unique (ip)
)
    charset = utf8;

create table brand_names
(
    name varchar(75) collate utf8_unicode_ci not null
        primary key
);

create table brand_nouns
(
    name varchar(75) collate utf8_unicode_ci not null
        primary key
);

create table brand_verbs
(
    name varchar(75) collate utf8_unicode_ci not null
        primary key
);

create table bundle
(
    id             int unsigned           not null
        primary key,
    name           varchar(50)            not null,
    amount         int unsigned default 0 null,
    display_amount varchar(30)            null,
    currency       varchar(10)            not null,
    time_start     int unsigned           not null,
    time_end       int unsigned           not null
)
    collate = utf8_unicode_ci;

create table bundle_partner
(
    id   int unsigned not null
        primary key,
    name varchar(50)  not null
)
    collate = utf8_unicode_ci;

create table bundle_partner_codes
(
    bundle_id      int unsigned               not null,
    partner_id     int unsigned               not null,
    code           varchar(255)               not null,
    status         tinyint unsigned default 0 null,
    time_assigned  int unsigned     default 0 null,
    bundle_user_id int unsigned     default 0 null,
    bundle_log_id  bigint unsigned  default 0 null,
    primary key (bundle_id, partner_id, code)
)
    collate = utf8_unicode_ci;

create index bundle_log_idx
    on bundle_partner_codes (bundle_log_id, partner_id);

create index bundle_user_idx
    on bundle_partner_codes (bundle_id, bundle_user_id, partner_id);

create table bundle_partner_codes_test
(
    bundle_id      int unsigned               not null,
    partner_id     int unsigned               not null,
    code           varchar(255)               not null,
    status         tinyint unsigned default 0 null,
    time_assigned  int unsigned     default 0 null,
    bundle_user_id int unsigned     default 0 null,
    bundle_log_id  bigint unsigned  default 0 null,
    primary key (bundle_id, partner_id, code)
)
    collate = utf8_unicode_ci;

create index bundle_log_idx
    on bundle_partner_codes_test (bundle_log_id, partner_id);

create index bundle_user_idx
    on bundle_partner_codes_test (bundle_id, bundle_user_id, partner_id);

create table bundle_purchase_log
(
    log_id                    bigint unsigned auto_increment
        primary key,
    bundle_user_id            int unsigned                  not null,
    stripe_charge_id          varchar(255) collate utf8_bin null,
    paypal_txn_id             varchar(50) collate utf8_bin  null,
    paypal_transaction_log_id bigint unsigned  default 0    null,
    amount                    int unsigned     default 0    null,
    currency                  varchar(10)                   not null,
    time_added                int unsigned                  not null,
    livemode                  tinyint unsigned default 0    not null
)
    collate = utf8_unicode_ci;

create index bundle_user_idx
    on bundle_purchase_log (bundle_user_id, livemode);

create index stripe_charge_idx
    on bundle_purchase_log (stripe_charge_id);

create table bundle_users
(
    bundle_user_id int unsigned auto_increment
        primary key,
    pocket_user_id int unsigned     default 0    not null,
    bundle_id      int unsigned                  not null,
    stripe_id      varchar(255) collate utf8_bin null,
    email          varchar(150)                  not null,
    time_added     int unsigned                  not null,
    livemode       tinyint unsigned default 0    not null
)
    collate = utf8_unicode_ci;

create index bundle_email_idx
    on bundle_users (bundle_id, email, livemode);

create index pocket_user_idx
    on bundle_users (bundle_id, pocket_user_id, livemode);

create index stripe_idx
    on bundle_users (bundle_id, stripe_id, livemode);

create table campaign
(
    id                 int unsigned auto_increment
        primary key,
    campaign_type_id   smallint(5)                          not null,
    name               varchar(255) collate utf8_unicode_ci not null,
    time_created       int                                  not null,
    start_date         int                                  not null,
    end_date           int                                  not null,
    priority           tinyint   default 0                  null,
    allow_override     tinyint   default 0                  null comment '0: do not override, use priority for conflicts; 1: override, this campaign gets sent no matter what',
    time_schedule      int                                  null,
    active             tinyint   default 0                  null,
    bronto_delivery_id varchar(255) collate utf8_unicode_ci null,
    email_list_name    longtext                             null,
    updated_at         timestamp default CURRENT_TIMESTAMP  not null on update CURRENT_TIMESTAMP,
    constraint bronto_delivery_id_UNIQUE
        unique (bronto_delivery_id),
    constraint name_idx
        unique (name)
)
    charset = utf8;

create index active_idx
    on campaign (active, start_date, end_date);

create index updated_at
    on campaign (updated_at);

create table campaign_link
(
    id          int(20) unsigned auto_increment
        primary key,
    campaign_id int unsigned                        not null,
    link        varchar(255) collate utf8_bin       not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint campaign_link_idx
        unique (campaign_id, link)
)
    charset = utf8;

create index updated_at
    on campaign_link (updated_at);

create table campaign_target
(
    id                 bigint auto_increment
        primary key,
    campaign_id        int unsigned           not null,
    user_id            int unsigned           not null,
    data_id            int unsigned default 0 not null,
    target             varchar(200)           not null,
    send_date          int                    not null,
    processed          tinyint      default 0 null comment '0: not yet processed; 1: processed; 2: skipped',
    status             tinyint      default 0 null comment '0: not sent; 1: processed; 2: delivered; 3: opened; 4: clicked',
    send_error_type    tinyint      default 0 null comment '0: no error; 1: deferred; 2: bounce; 3: drop; 4: spam report',
    click_cta          tinyint      default 0 null,
    click_footer       tinyint      default 0 null,
    click_unsubscribe  tinyint      default 0 null,
    click_other        tinyint      default 0 null,
    goal_complete      tinyint      default 0 null,
    delivered_time     int                    null,
    opened_time        int                    null,
    clicked_time       int                    null,
    cta_time           int                    null,
    goal_complete_time int                    null,
    time_sent          int                    null,
    campaign_batch_id  bigint                 null,
    constraint target_campaign_idx
        unique (campaign_id, target, data_id),
    constraint user_campaign_idx
        unique (campaign_id, user_id, data_id)
)
    charset = utf8;

create index campaign_batch_idx
    on campaign_target (campaign_batch_id);

create index campaign_processed
    on campaign_target (campaign_id, processed);

create index campaign_status
    on campaign_target (campaign_id, status);

create index user_processed
    on campaign_target (user_id, processed);

create table campaign_target_clicks
(
    campaign_target_id bigint                              not null,
    campaign_id        int unsigned                        not null,
    campaign_link_id   int unsigned                        not null,
    clicked_time       int                                 null,
    updated_at         timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (campaign_target_id, campaign_link_id)
)
    charset = utf8;

create index campaign_link_idx
    on campaign_target_clicks (campaign_id, campaign_link_id);

create index updated_at
    on campaign_target_clicks (updated_at);

create table campaign_target_vars
(
    id    bigint not null
        primary key,
    value text   null
)
    collate = utf8_unicode_ci;

create table campaign_test
(
    id                    int unsigned auto_increment
        primary key,
    campaign_id           int unsigned       not null,
    campaign_test_type_id smallint(5)        not null,
    name                  varchar(40)        not null,
    population_pct        smallint default 0 null,
    time_created          int                not null,
    active                tinyint  default 0 null
)
    charset = utf8;

create index active_idx
    on campaign_test (active);

create index campaign_idx
    on campaign_test (campaign_id, active);

create table campaign_test_log
(
    campaign_id       int    not null,
    campaign_batch_id bigint not null,
    test_id           int    not null,
    option_id         int    not null,
    primary key (campaign_id, campaign_batch_id, test_id)
)
    charset = utf8;

create table campaign_test_options
(
    id               int auto_increment
        primary key,
    campaign_test_id int                not null,
    name             varchar(40)        not null,
    weight           smallint default 1 null,
    value            text               null,
    view_count       int      default 0 null
)
    charset = utf8;

create index target_options_idx
    on campaign_test_options (campaign_test_id, weight);

create table campaign_test_type
(
    id   smallint(5) not null
        primary key,
    name varchar(20) null
)
    charset = utf8;

create table campaign_type
(
    id   smallint(5) not null
        primary key,
    name varchar(20) null
)
    charset = utf8;

create table captcha_whitelist_ips
(
    ip         varchar(39) collate utf8_unicode_ci not null
        primary key,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    expires_at timestamp                           not null
)
    charset = utf8;

create table card_type
(
    id   tinyint unsigned not null
        primary key,
    name varchar(30)      not null
)
    collate = utf8_unicode_ci;

create table channel_posts
(
    channel_id int unsigned                        not null,
    post_id    int(10)                             not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (channel_id, post_id)
)
    collate = utf8_unicode_ci;

create index post_idx
    on channel_posts (post_id);

create index updated_at
    on channel_posts (updated_at);

create table channels
(
    channel_id         int unsigned auto_increment
        primary key,
    created_by_user_id int unsigned                                  not null,
    channel_type       tinyint(4) unsigned default 0                 null,
    name               varchar(140)                                  null,
    description        text                                          null,
    privacy            tinyint(4) unsigned default 0                 null,
    time_created       datetime                                      not null,
    updated_at         timestamp           default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index created_by_user_id
    on channels (created_by_user_id, channel_type);

create index updated_at
    on channels (updated_at);

create table comments
(
    comment_id  bigint unsigned auto_increment
        primary key,
    share_id    int unsigned        not null,
    user_id     int unsigned        not null,
    comment     text                not null,
    api_id      mediumint unsigned  not null,
    time_posted bigint unsigned     not null,
    type        tinyint(1) unsigned not null,
    original    tinyint(1) unsigned not null
)
    collate = utf8_unicode_ci;

create index share_id
    on comments (share_id, time_posted);

create index user_id
    on comments (user_id);

create table contact_hashes
(
    contact_id   bigint unsigned auto_increment
        primary key,
    contact_hash char(64)            not null,
    type         tinyint(1) unsigned not null,
    user_id      int unsigned        not null,
    confirmed    tinyint(1) unsigned not null,
    time_updated int unsigned        not null,
    constraint hash_idx
        unique (contact_hash)
)
    collate = utf8_unicode_ci;

create index time_idx
    on contact_hashes (time_updated);

create index user_idx
    on contact_hashes (user_id);

create table contact_index
(
    user_id      int unsigned    not null,
    contact_id   bigint unsigned not null,
    time_updated int unsigned    not null,
    primary key (user_id, contact_id)
)
    collate = utf8_unicode_ci;

create index contact_idx
    on contact_index (contact_id);

create index time_idx
    on contact_index (time_updated);

create table contact_sort
(
    user_id           int unsigned                        not null,
    suggested_user_id int unsigned                        not null,
    weight            decimal(5, 2) unsigned default 0.00 null,
    time_added        int unsigned           default 0    null,
    primary key (user_id, suggested_user_id)
)
    charset = utf8;

create index weight_idx
    on contact_sort (user_id, suggested_user_id, weight);

create table conversation_messages
(
    id              int unsigned auto_increment
        primary key,
    created_at      timestamp default CURRENT_TIMESTAMP not null,
    updated_at      timestamp default CURRENT_TIMESTAMP not null,
    author_id       int unsigned                        not null,
    conversation_id int unsigned                        not null,
    text            mediumtext                          null,
    quote           mediumtext                          null,
    client_uuid     varchar(50)                         not null,
    constraint client_uuid_idx
        unique (client_uuid)
)
    collate = utf8mb4_unicode_ci;

create table conversation_recipients
(
    conversation_id int unsigned not null,
    friend_id       int unsigned not null,
    primary key (conversation_id, friend_id)
)
    collate = utf8mb4_unicode_ci;

create table conversations
(
    id          int unsigned auto_increment
        primary key,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null,
    item_id     int unsigned                        not null,
    client_uuid varchar(50)                         not null,
    constraint client_uuid_idx
        unique (client_uuid)
)
    collate = utf8mb4_unicode_ci;

create table coupons
(
    coupon_id          int unsigned auto_increment
        primary key,
    name               varchar(50)                 not null,
    amount_off         int unsigned      default 0 null,
    currency           varchar(10)                 not null,
    percent_off        int unsigned      default 0 null,
    duration           varchar(10)                 not null,
    duration_in_months smallint unsigned default 0 null,
    max_redemptions    int unsigned      default 0 null,
    times_redeemed     int unsigned      default 0 null,
    redeem_by          int unsigned      default 0 null,
    status             tinyint unsigned  default 0 null,
    constraint name_idx
        unique (name)
)
    collate = utf8_unicode_ci;

create index status_idx
    on coupons (status);

create table curated_feed_candidates
(
    id         int unsigned auto_increment
        primary key,
    feed_id    int unsigned                        not null,
    item_id    int unsigned                        not null,
    type       varchar(50) collate utf8mb4_bin     not null,
    score      decimal(21, 20) unsigned            not null,
    expires_at timestamp                           not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    charset = utf8mb4;

create index feed_expires_idx
    on curated_feed_candidates (feed_id, expires_at);

create index feed_item_id_idx
    on curated_feed_candidates (feed_id, item_id);

create table curated_feed_items
(
    curated_rec_id int unsigned auto_increment
        primary key,
    feed_id        int unsigned                                             default 0      not null,
    resolved_id    int unsigned                                                            not null,
    prospect_id    int unsigned                                             default 0      not null,
    queued_id      int unsigned                                             default 0      not null,
    status         enum ('live', 'removed', 'spoc') collate utf8_unicode_ci default 'live' null,
    time_live      int                                                      default 0      null,
    time_added     int                                                      default 0      null,
    time_updated   int                                                      default 0      null
)
    charset = utf8;

create index queued_item_idx
    on curated_feed_items (queued_id);

create index resolved_idx
    on curated_feed_items (feed_id, resolved_id);

create index status_time_idx
    on curated_feed_items (feed_id, status, time_live);

create table curated_feed_items_backup_5_10_22
(
    curated_rec_id int unsigned auto_increment
        primary key,
    feed_id        int unsigned                                             default 0      not null,
    resolved_id    int unsigned                                                            not null,
    prospect_id    int unsigned                                             default 0      not null,
    queued_id      int unsigned                                             default 0      not null,
    status         enum ('live', 'removed', 'spoc') collate utf8_unicode_ci default 'live' null,
    time_live      int                                                      default 0      null,
    time_added     int                                                      default 0      null,
    time_updated   int                                                      default 0      null,
    constraint queued_item_idx
        unique (queued_id),
    constraint resolved_idx
        unique (feed_id, resolved_id)
)
    charset = utf8;

create index status_time_idx
    on curated_feed_items_backup_5_10_22 (feed_id, status, time_live);

create table curated_feed_items_deleted
(
    id              int unsigned auto_increment
        primary key,
    curated_rec_id  int unsigned                                                                       not null,
    feed_id         int unsigned                                             default 0                 not null,
    resolved_id     int unsigned                                                                       not null,
    prospect_id     int unsigned                                             default 0                 not null,
    queued_id       int unsigned                                             default 0                 not null,
    status          enum ('live', 'removed', 'spoc') collate utf8_unicode_ci default 'live'            null,
    time_live       int                                                      default 0                 null,
    time_added      int                                                      default 0                 null,
    time_updated    int                                                      default 0                 null,
    deleted_user_id int                                                                                not null,
    deleted_at      timestamp                                                default CURRENT_TIMESTAMP not null
)
    charset = utf8;

create index status_time_idx
    on curated_feed_items_deleted (feed_id, status, time_live);

create table curated_feed_prospects
(
    prospect_id   int unsigned auto_increment
        primary key,
    feed_id       int unsigned                                                               default 0       not null,
    resolved_id   int unsigned                                                                               not null,
    type          varchar(50) collate utf8_unicode_ci                                                        null,
    status        enum ('ready', 'approved', 'denied', 'unapproved') collate utf8_unicode_ci default 'ready' null,
    curator       varchar(50) collate utf8_unicode_ci                                                        null,
    time_added    int                                                                        default 0       null,
    time_updated  int                                                                        default 0       null,
    top_domain_id int unsigned                                                                               null,
    title         varchar(200) collate utf8_unicode_ci                                                       null,
    excerpt       text collate utf8_unicode_ci                                                               null,
    image_src     text collate utf8_unicode_ci                                                               null
)
    charset = utf8;

create index domain_title_idx
    on curated_feed_prospects (feed_id, top_domain_id, title);

create index resolved_idx
    on curated_feed_prospects (feed_id, resolved_id);

create table curated_feed_prospects_5_11_22
(
    prospect_id   int unsigned auto_increment
        primary key,
    feed_id       int unsigned                                                               default 0       not null,
    resolved_id   int unsigned                                                                               not null,
    type          varchar(50) collate utf8_unicode_ci                                                        null,
    status        enum ('ready', 'approved', 'denied', 'unapproved') collate utf8_unicode_ci default 'ready' null,
    curator       varchar(50) collate utf8_unicode_ci                                                        null,
    time_added    int                                                                        default 0       null,
    time_updated  int                                                                        default 0       null,
    top_domain_id int unsigned                                                                               null,
    title         varchar(200) collate utf8_unicode_ci                                                       null,
    excerpt       text collate utf8_unicode_ci                                                               null,
    image_src     text collate utf8_unicode_ci                                                               null,
    constraint resolved_idx
        unique (feed_id, resolved_id)
)
    charset = utf8;

create index domain_title_idx
    on curated_feed_prospects_5_11_22 (feed_id, top_domain_id, title);

create table curated_feed_queued_items
(
    queued_id        int unsigned auto_increment
        primary key,
    feed_id          int unsigned                                                         default 0       not null,
    resolved_id      int unsigned                                                                         not null,
    prospect_id      int unsigned                                                         default 0       not null,
    status           enum ('ready', 'used', 'removed', 'expired') collate utf8_unicode_ci default 'ready' null,
    curator          varchar(50) collate utf8_unicode_ci                                                  null,
    relevance_length enum ('day', 'week', 'forever') collate utf8_unicode_ci              default 'week'  null,
    topic_id         int unsigned                                                         default 0       not null,
    weight           int unsigned                                                         default 1       not null,
    time_added       int                                                                  default 0       null,
    time_updated     int                                                                  default 0       null
)
    charset = utf8;

create index prospect_idx
    on curated_feed_queued_items (prospect_id);

create index resolved_idx
    on curated_feed_queued_items (feed_id, resolved_id);

create index status_idx
    on curated_feed_queued_items (status);

create index status_rel_idx
    on curated_feed_queued_items (feed_id, status, relevance_length);

create index status_weight_idx
    on curated_feed_queued_items (feed_id, status, weight);

create table curated_feed_queued_items_5_11_22
(
    queued_id        int unsigned auto_increment
        primary key,
    feed_id          int unsigned                                                         default 0       not null,
    resolved_id      int unsigned                                                                         not null,
    prospect_id      int unsigned                                                         default 0       not null,
    status           enum ('ready', 'used', 'removed', 'expired') collate utf8_unicode_ci default 'ready' null,
    curator          varchar(50) collate utf8_unicode_ci                                                  null,
    relevance_length enum ('day', 'week', 'forever') collate utf8_unicode_ci              default 'week'  null,
    topic_id         int unsigned                                                         default 0       not null,
    weight           int unsigned                                                         default 1       not null,
    time_added       int                                                                  default 0       null,
    time_updated     int                                                                  default 0       null,
    constraint prospect_idx
        unique (prospect_id),
    constraint resolved_idx
        unique (feed_id, resolved_id)
)
    charset = utf8;

create index status_idx
    on curated_feed_queued_items_5_11_22 (status);

create index status_rel_idx
    on curated_feed_queued_items_5_11_22 (feed_id, status, relevance_length);

create index status_weight_idx
    on curated_feed_queued_items_5_11_22 (feed_id, status, weight);

create table curated_feed_topic_domains
(
    topic_id     int unsigned                                 default 0      not null,
    domain_id    int unsigned                                 default 0      not null,
    score        decimal(5, 4)                                default 0.0000 null,
    domain_type  varchar(255) collate utf8_unicode_ci                        not null,
    version      varchar(255) collate utf8_unicode_ci                        not null,
    status       enum ('live', 'off') collate utf8_unicode_ci default 'live' null,
    time_added   int                                          default 0      null,
    time_updated int                                          default 0      null,
    primary key (topic_id, domain_id, version)
)
    charset = utf8;

create table curated_feed_topic_tags
(
    topic_id      int unsigned                                 default 0      not null,
    suggested_tag varchar(100) collate utf8_unicode_ci                        not null,
    grouping_id   bigint unsigned                              default 0      not null,
    score         decimal(5, 4)                                default 1.0000 null,
    status        enum ('live', 'off') collate utf8_unicode_ci default 'live' null,
    time_added    int                                          default 0      null,
    time_updated  int                                          default 0      null,
    primary key (topic_id, grouping_id)
)
    charset = utf8;

create index grouping_idx
    on curated_feed_topic_tags (grouping_id);

create table curated_feed_topics
(
    topic_id     int unsigned auto_increment
        primary key,
    name         varchar(100) collate utf8_unicode_ci                        not null,
    status       enum ('live', 'off') collate utf8_unicode_ci default 'live' null,
    time_added   int                                          default 0      null,
    time_updated int                                          default 0      null,
    constraint name_idx
        unique (name)
)
    charset = utf8;

create index status_idx
    on curated_feed_topics (status);

create table curated_feeds
(
    feed_id                   int unsigned auto_increment
        primary key,
    name                      varchar(50) collate utf8_unicode_ci                          null,
    description               varchar(200) collate utf8_unicode_ci                         null,
    slug                      varchar(12) collate utf8_unicode_ci                          null,
    language                  varchar(10) collate utf8_unicode_ci          default 'en-US' null,
    hourly_cadence            int unsigned                                 default 1       not null,
    queue_minimum             int unsigned                                 default 12      not null,
    prospect_slack_channel    varchar(21) collate utf8_unicode_ci                          null,
    prospect_slack_channel_id varchar(255) collate utf8_unicode_ci                         null,
    prospect_slack_webhook    text collate utf8_unicode_ci                                 not null,
    feed_slack_channel        varchar(21) collate utf8_unicode_ci                          null,
    feed_slack_webhook        text collate utf8_unicode_ci                                 not null,
    curate_slack_channel      varchar(21) collate utf8_unicode_ci                          null,
    curate_slack_webhook      text collate utf8_unicode_ci                                 not null,
    status                    enum ('live', 'off') collate utf8_unicode_ci default 'live'  null,
    time_added                int                                          default 0       null,
    time_updated              int                                          default 0       null
)
    charset = utf8;

create index slug_idx
    on curated_feeds (slug);

create index status_idx
    on curated_feeds (status);

create table curated_rec_processing_domain_max
(
    domain_id     int unsigned not null
        primary key,
    true_save_max int unsigned null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_domain_max_delete
(
    domain_id     int unsigned not null
        primary key,
    true_save_max int unsigned null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_domain_max_gb
(
    domain_id     int unsigned not null
        primary key,
    true_save_max int unsigned null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_domain_max_gb_delete
(
    domain_id     int unsigned not null
        primary key,
    true_save_max int unsigned null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_domain_max_gb_old
(
    domain_id     int unsigned not null
        primary key,
    true_save_max int unsigned null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_domain_max_old
(
    domain_id     int unsigned not null
        primary key,
    true_save_max int unsigned null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_item_stats
(
    resolved_id  int unsigned default 0 not null
        primary key,
    save_cnt     int(10)                null,
    impact_score decimal(7, 4)          null
)
    charset = utf8;

create table curated_rec_processing_item_stats_old
(
    resolved_id  int unsigned default 0 not null
        primary key,
    save_cnt     int(10)                null,
    impact_score decimal(7, 4)          null
)
    charset = utf8;

create table curated_rec_processing_true_saves
(
    resolved_id int unsigned           not null
        primary key,
    save_cnt    int unsigned default 0 not null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_true_saves_delete
(
    resolved_id int unsigned           not null
        primary key,
    save_cnt    int unsigned default 0 not null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_true_saves_gb
(
    resolved_id int unsigned           not null
        primary key,
    save_cnt    int unsigned default 0 not null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_true_saves_gb_old
(
    resolved_id int unsigned           not null
        primary key,
    save_cnt    int unsigned default 0 not null
)
    collate = utf8_unicode_ci;

create table curated_rec_processing_true_saves_old
(
    resolved_id int unsigned           not null
        primary key,
    save_cnt    int unsigned default 0 not null
)
    collate = utf8_unicode_ci;

create table desk_case_labels
(
    case_id  mediumint unsigned not null,
    label_id mediumint unsigned not null,
    primary key (case_id, label_id)
)
    collate = utf8_unicode_ci;

create index label_id_key
    on desk_case_labels (label_id);

create table desk_cases
(
    case_id          mediumint unsigned  not null
        primary key,
    updated_at       int unsigned        not null,
    created_at       int unsigned        not null,
    case_status_type varchar(150)        not null,
    open             tinyint(1) unsigned not null
)
    collate = utf8_unicode_ci;

create index created_at
    on desk_cases (created_at);

create index open
    on desk_cases (open);

create index updated_at
    on desk_cases (updated_at);

create table desk_labels
(
    label_id mediumint unsigned auto_increment
        primary key,
    label    varchar(150) not null,
    constraint label
        unique (label)
)
    collate = utf8_unicode_ci;

create table dev_commits
(
    hash           varchar(75)         not null,
    repo           varchar(150)        not null,
    committed_time int unsigned        not null,
    committer_id   mediumint unsigned  not null,
    files          mediumint unsigned  not null,
    ins            mediumint unsigned  not null,
    del            mediumint unsigned  not null,
    `ignore`       tinyint(1) unsigned not null,
    primary key (hash, repo)
)
    collate = utf8_unicode_ci;

create index committer_id
    on dev_commits (committer_id);

create table dev_committer_names
(
    committer_id mediumint unsigned auto_increment
        primary key,
    name         varchar(150) not null
)
    collate = utf8_unicode_ci;

create index name
    on dev_committer_names (name);

create table digest_batch
(
    item_id int unsigned       not null,
    url     text               not null,
    user_id mediumint unsigned not null,
    primary key (item_id, user_id)
);

create index user_id
    on digest_batch (user_id);

create table digest_items
(
    item_id      int unsigned        not null
        primary key,
    status       tinyint unsigned    not null,
    last_updated datetime            not null,
    resolved_url text charset latin1 not null,
    domain       varchar(255)        not null,
    title        text                not null,
    excerpt      text charset latin1 not null,
    image        text charset latin1 not null,
    video        text charset latin1 not null
)
    collate = utf8_unicode_ci partition by range ( item_id) (
    partition p0 values less than (5000000),
    partition p1 values less than (10000000),
    partition p2 values less than (15000000),
    partition p3 values less than (20000000),
    partition p4 values less than (25000000),
    partition p5 values less than (30000000),
    partition p6 values less than (35000000),
    partition p7 values less than (40000000),
    partition p8 values less than (45000000),
    partition p9 values less than (50000000),
    partition p10 values less than (55000000),
    partition p11 values less than (60000000),
    partition p12 values less than (65000000),
    partition p13 values less than (70000000),
    partition p14 values less than (75000000),
    partition p15 values less than (80000000),
    partition p16 values less than (85000000),
    partition p17 values less than (90000000),
    partition p18 values less than (105000000),
    partition p19 values less than (MAXVALUE)
    );

create index domain
    on digest_items (domain);

create index last_updated
    on digest_items (last_updated);

create index status
    on digest_items (status);

create table digest_items_copy
(
    item_id      int unsigned        not null
        primary key,
    status       tinyint unsigned    not null,
    last_updated datetime            not null,
    resolved_url text charset latin1 not null,
    domain       varchar(255)        not null,
    title        text                not null,
    excerpt      text charset latin1 not null,
    image        text charset latin1 not null,
    video        text charset latin1 not null,
    constraint domainItemId
        unique (domain, item_id)
)
    collate = utf8_unicode_ci partition by range ( item_id) (
    partition p0 values less than (5000000),
    partition p1 values less than (10000000),
    partition p2 values less than (15000000),
    partition p3 values less than (20000000),
    partition p4 values less than (25000000),
    partition p5 values less than (30000000),
    partition p6 values less than (35000000),
    partition p7 values less than (40000000),
    partition p8 values less than (45000000),
    partition p9 values less than (50000000),
    partition p10 values less than (55000000),
    partition p11 values less than (60000000),
    partition p12 values less than (65000000),
    partition p13 values less than (70000000),
    partition p14 values less than (75000000),
    partition p15 values less than (80000000),
    partition p16 values less than (85000000),
    partition p17 values less than (90000000),
    partition p18 values less than (105000000),
    partition p19 values less than (MAXVALUE)
    );

create index domain
    on digest_items_copy (domain);

create index last_updated
    on digest_items_copy (last_updated);

create index status
    on digest_items_copy (status);

create table digest_list
(
    user_id      mediumint     not null,
    item_id      int           not null,
    topic_id     int           not null,
    score        decimal(4, 2) not null,
    time_updated datetime      not null,
    status       tinyint(3)    not null,
    primary key (user_id, item_id, topic_id)
);

create index item_id
    on digest_list (item_id);

create index status
    on digest_list (status);

create index topic_id
    on digest_list (topic_id);

create index uist
    on digest_list (user_id, item_id, status, score, topic_id);

create index user_id
    on digest_list (user_id, topic_id, item_id);

create table digest_topics
(
    topic_id int unsigned auto_increment
        primary key,
    name     varchar(50) collate utf8_unicode_ci not null,
    slug     varchar(50) collate utf8_unicode_ci not null,
    type_id  smallint unsigned                   not null,
    shared   tinyint(1)                          not null
)
    partition by range ( topic_id) (
        partition p0 values less than (100000),
        partition p1 values less than (200000),
        partition p2 values less than (300000),
        partition p3 values less than (400000),
        partition p4 values less than (500000),
        partition p5 values less than (600000),
        partition p6 values less than (700000),
        partition p7 values less than (800000),
        partition p8 values less than (900000),
        partition p9 values less than (1000000),
        partition p10 values less than (MAXVALUE)
        );

create index slug
    on digest_topics (slug);

create index type_id
    on digest_topics (type_id);

create table digest_topics_keywords
(
    topic_id  int unsigned                        not null,
    keyword   varchar(30) collate utf8_unicode_ci not null,
    min_score decimal(4, 3)                       not null,
    primary key (topic_id, keyword)
)
    partition by range ( topic_id) (
        partition p0 values less than (100000),
        partition p1 values less than (200000),
        partition p2 values less than (300000),
        partition p3 values less than (400000),
        partition p4 values less than (500000),
        partition p5 values less than (600000),
        partition p6 values less than (700000),
        partition p7 values less than (800000),
        partition p8 values less than (900000),
        partition p9 values less than (1000000),
        partition p10 values less than (MAXVALUE)
        );

create index keyword
    on digest_topics_keywords (keyword);

create index topicKeywordScore
    on digest_topics_keywords (topic_id, keyword, min_score);

create table digest_topics_tags
(
    topic_id  int unsigned                        not null,
    tag       varchar(30) collate utf8_unicode_ci not null,
    min_score decimal(4, 3)                       not null,
    primary key (topic_id, tag)
)
    partition by range ( topic_id) (
        partition p0 values less than (100000),
        partition p1 values less than (200000),
        partition p2 values less than (300000),
        partition p3 values less than (400000),
        partition p4 values less than (500000),
        partition p5 values less than (600000),
        partition p6 values less than (700000),
        partition p7 values less than (800000),
        partition p8 values less than (900000),
        partition p9 values less than (1000000),
        partition p10 values less than (MAXVALUE)
        );

create index tag
    on digest_topics_tags (tag);

create index topicKeywordScore
    on digest_topics_tags (topic_id, tag, min_score);

create table digest_topics_users
(
    user_id      mediumint unsigned not null,
    topic_id     int unsigned       not null,
    sort_id      tinyint unsigned   not null,
    status       tinyint            not null,
    needs_update tinyint unsigned   not null,
    time_updated datetime           not null,
    shared       tinyint(1)         not null,
    primary key (user_id, topic_id)
)
    partition by range ( user_id) (
        partition p0 values less than (200000),
        partition p1 values less than (400000),
        partition p2 values less than (600000),
        partition p3 values less than (800000),
        partition p4 values less than (1000000),
        partition p5 values less than (1200000),
        partition p6 values less than (1400000),
        partition p7 values less than (1600000),
        partition p8 values less than (1800000),
        partition p9 values less than (2000000),
        partition p10 values less than (2200000),
        partition p11 values less than (2400000),
        partition p12 values less than (2600000),
        partition p13 values less than (2800000),
        partition p14 values less than (3000000),
        partition p15 values less than (MAXVALUE)
        );

create index utss
    on digest_topics_users (user_id, topic_id, status, shared);

create table digest_users
(
    user_id        mediumint unsigned not null
        primary key,
    type           tinyint(3)         not null,
    public         tinyint unsigned   not null,
    invite_email   text               not null,
    invite_date    datetime           not null,
    trial_date     datetime           not null,
    purchase_date  datetime           not null,
    list_updated   datetime           not null,
    topics_updated datetime           not null,
    why            text               not null,
    trans_id       varchar(20)        not null,
    sub_id         varchar(20)        not null,
    first_name     varchar(50)        not null,
    last_name      varchar(50)        not null,
    status         tinyint unsigned   not null
);

create index status
    on digest_users (status);

create index sub_id
    on digest_users (sub_id);

create index trans_id
    on digest_users (trans_id);

create index type
    on digest_users (type);

create table digest_users_locks
(
    user_id mediumint unsigned not null
        primary key,
    `lock`  datetime           not null
)
    collate = utf8_unicode_ci;

create index `lock`
    on digest_users_locks (`lock`);

create table domain_filters
(
    domain_id  int unsigned     default 0                 not null
        primary key,
    type       tinyint unsigned default 1                 null,
    created_at timestamp        default CURRENT_TIMESTAMP not null,
    updated_at timestamp        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    notes      text                                       not null
)
    collate = utf8_unicode_ci;

create table email_confirmation_tokens
(
    token        varchar(75) not null
        primary key,
    time_created datetime    null
)
    collate = utf8_unicode_ci;

create table email_digest_history
(
    id                 bigint unsigned auto_increment
        primary key,
    campaign_target_id bigint unsigned not null,
    user_id            int unsigned    not null,
    item_id            int unsigned    not null
)
    charset = utf8;

create index campaign_target_idx
    on email_digest_history (campaign_target_id);

create index user_idx
    on email_digest_history (user_id);

create table email_interest
(
    user_id                int unsigned                         not null,
    email                  varchar(150) collate utf8_unicode_ci not null,
    email_interest_type_id smallint unsigned                    not null,
    last_update_time       int unsigned                         null,
    primary key (email_interest_type_id, email)
)
    charset = utf8;

create table email_interest_type
(
    email_interest_type_id smallint unsigned auto_increment
        primary key,
    name                   varchar(30) collate utf8_unicode_ci not null
)
    charset = utf8;

create table eoy_2014_topics
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null,
    file_name     varchar(100) collate utf8_unicode_ci not null,
    url_slug      varchar(100) collate utf8_unicode_ci null
)
    charset = utf8;

create table eoy_2014_user_devices
(
    user_id  int unsigned     not null,
    device   varchar(50)      not null,
    open_cnt int unsigned     null,
    open_pct tinyint unsigned null,
    primary key (user_id, device)
)
    collate = utf8_unicode_ci;

create table eoy_2014_user_items
(
    user_id     int unsigned not null,
    resolved_id int unsigned not null,
    save_cnt    int unsigned null,
    primary key (user_id, resolved_id)
)
    collate = utf8_unicode_ci;

create table eoy_2014_user_summary
(
    user_id          int unsigned     not null
        primary key,
    user_slug        varchar(64)      null,
    top_percentile   tinyint unsigned null,
    open_cnt         int unsigned     null,
    article_cnt      int unsigned     null,
    article_word_cnt int unsigned     null,
    est_word_cnt     int unsigned     null
)
    collate = utf8_unicode_ci;

create index percentile_idx
    on eoy_2014_user_summary (top_percentile, user_id);

create index slug_idx
    on eoy_2014_user_summary (user_slug);

create table eoy_2014_user_topics
(
    user_id     int unsigned            not null,
    grouping_id bigint unsigned         not null,
    topic_name  varchar(100)            not null,
    score       decimal(11, 3) unsigned null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create table eoy_2014_user_weekdays
(
    user_id  int unsigned                  not null,
    weekday  tinyint(1) unsigned default 0 not null,
    day_name varchar(50)                   not null,
    save_avg decimal(11, 3) unsigned       null,
    open_avg decimal(11, 3) unsigned       null,
    save_pct decimal(5, 2) unsigned        null,
    open_pct decimal(5, 2) unsigned        null,
    primary key (user_id, weekday)
)
    collate = utf8_unicode_ci;

create table eoy_2015_topic_suggestions
(
    grouping_id bigint unsigned            not null,
    `rank`      tinyint unsigned default 0 not null,
    user_id     int unsigned               not null,
    primary key (grouping_id, `rank`)
)
    collate = utf8_unicode_ci;

create table eoy_2015_topics
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null,
    file_name     varchar(100) collate utf8_unicode_ci not null,
    url_slug      varchar(100) collate utf8_unicode_ci null
)
    charset = utf8;

create table eoy_2015_user_items
(
    user_id     int unsigned not null,
    resolved_id int unsigned not null,
    save_cnt    int unsigned null,
    primary key (user_id, resolved_id)
)
    collate = utf8_unicode_ci;

create index save_idx
    on eoy_2015_user_items (user_id, save_cnt);

create table eoy_2015_user_summary
(
    user_id          int unsigned     not null
        primary key,
    user_slug        varchar(10)      null,
    top_percentile   tinyint unsigned null,
    open_cnt         int unsigned     null,
    article_cnt      int unsigned     null,
    article_word_cnt int unsigned     null,
    est_word_cnt     int unsigned     null,
    twitter_ind      tinyint unsigned null,
    popular_ind      tinyint unsigned null,
    topics_ind       tinyint unsigned null
)
    collate = utf8_unicode_ci;

create index slug_idx
    on eoy_2015_user_summary (user_slug);

create table eoy_2015_user_topics
(
    user_id     int unsigned            not null,
    grouping_id bigint unsigned         not null,
    topic_name  varchar(100)            not null,
    score       decimal(11, 3) unsigned null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create index score_idx
    on eoy_2015_user_topics (user_id, score);

create table eoy_2016_topics
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null,
    file_name     varchar(100) collate utf8_unicode_ci not null,
    url_slug      varchar(100) collate utf8_unicode_ci null
)
    charset = utf8;

create table eoy_2016_user_items
(
    user_id     int unsigned not null,
    resolved_id int unsigned not null,
    save_cnt    int unsigned null,
    primary key (user_id, resolved_id)
)
    collate = utf8_unicode_ci;

create index save_idx
    on eoy_2016_user_items (user_id, save_cnt);

create table eoy_2016_user_summary
(
    user_id          int unsigned     not null
        primary key,
    user_slug        varchar(10)      null,
    top_percentile   tinyint unsigned null,
    open_cnt         int unsigned     null,
    article_cnt      int unsigned     null,
    article_word_cnt int unsigned     null,
    est_word_cnt     int unsigned     null,
    popular_ind      tinyint unsigned null,
    topics_ind       tinyint unsigned null
)
    collate = utf8_unicode_ci;

create index slug_idx
    on eoy_2016_user_summary (user_slug);

create table eoy_2016_user_topics
(
    user_id     int unsigned            not null,
    grouping_id bigint unsigned         not null,
    topic_name  varchar(100)            not null,
    score       decimal(11, 3) unsigned null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create index score_idx
    on eoy_2016_user_topics (user_id, score);

create table eoy_2017_topics
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null,
    file_name     varchar(100) collate utf8_unicode_ci not null,
    url_slug      varchar(100) collate utf8_unicode_ci null
)
    charset = utf8;

create table eoy_2017_user_items
(
    user_id       int unsigned   not null,
    resolved_id   int unsigned   not null,
    sorting_score decimal(11, 4) null,
    primary key (user_id, resolved_id)
)
    collate = utf8_unicode_ci;

create index save_idx
    on eoy_2017_user_items (user_id, sorting_score);

create table eoy_2017_user_summary
(
    user_id          int unsigned     not null
        primary key,
    user_slug        varchar(10)      null,
    top_percentile   tinyint unsigned null,
    open_cnt         int unsigned     null,
    article_cnt      int unsigned     null,
    article_word_cnt int unsigned     null,
    est_word_cnt     int unsigned     null,
    popular_ind      tinyint unsigned null,
    topics_ind       tinyint unsigned null
)
    collate = utf8_unicode_ci;

create index slug_idx
    on eoy_2017_user_summary (user_slug);

create table eoy_2017_user_topics
(
    user_id     int unsigned            not null,
    grouping_id bigint unsigned         not null,
    topic_name  varchar(100)            not null,
    score       decimal(11, 3) unsigned null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create index score_idx
    on eoy_2017_user_topics (user_id, score);

create table eoy_2018_topics
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null,
    file_name     varchar(100) collate utf8_unicode_ci not null,
    url_slug      varchar(100) collate utf8_unicode_ci null
)
    charset = utf8;

create table eoy_2018_user_items
(
    user_id       int unsigned   not null,
    resolved_id   int unsigned   not null,
    sorting_score decimal(11, 4) null,
    primary key (user_id, resolved_id)
)
    collate = utf8_unicode_ci;

create index save_idx
    on eoy_2018_user_items (user_id, sorting_score);

create table eoy_2018_user_summary
(
    user_id          int unsigned     not null
        primary key,
    user_slug        varchar(10)      null,
    top_percentile   tinyint unsigned null,
    open_cnt         int unsigned     null,
    article_cnt      int unsigned     null,
    article_word_cnt int unsigned     null,
    webpage_cnt      int unsigned     null,
    webpage_word_cnt int unsigned     null,
    est_word_cnt     int unsigned     null,
    popular_ind      tinyint unsigned null,
    topics_ind       tinyint unsigned null
)
    collate = utf8_unicode_ci;

create index slug_idx
    on eoy_2018_user_summary (user_slug);

create table eoy_2018_user_topics
(
    user_id     int unsigned            not null,
    grouping_id bigint unsigned         not null,
    topic_name  varchar(100)            not null,
    score       decimal(11, 3) unsigned null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create index score_idx
    on eoy_2018_user_topics (user_id, score);

create table eoy_2019_topics
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null,
    file_name     varchar(100) collate utf8_unicode_ci not null,
    url_slug      varchar(100) collate utf8_unicode_ci null
)
    charset = utf8;

create table eoy_2019_user_items
(
    user_id       int unsigned   not null,
    resolved_id   int unsigned   not null,
    sorting_score decimal(11, 4) null,
    primary key (user_id, resolved_id)
)
    collate = utf8_unicode_ci;

create index save_idx
    on eoy_2019_user_items (user_id, sorting_score);

create table eoy_2019_user_summary
(
    user_id          int unsigned     not null
        primary key,
    user_slug        varchar(10)      null,
    top_percentile   tinyint unsigned null,
    open_cnt         int unsigned     null,
    article_cnt      int unsigned     null,
    article_word_cnt int unsigned     null,
    webpage_cnt      int unsigned     null,
    webpage_word_cnt int unsigned     null,
    est_word_cnt     int unsigned     null,
    popular_ind      tinyint unsigned null,
    topics_ind       tinyint unsigned null
)
    collate = utf8_unicode_ci;

create index slug_idx
    on eoy_2019_user_summary (user_slug);

create table eoy_2019_user_topics
(
    user_id     int unsigned            not null,
    grouping_id bigint unsigned         not null,
    topic_name  varchar(100)            not null,
    score       decimal(11, 3) unsigned null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create index score_idx
    on eoy_2019_user_topics (user_id, score);

create table event_type
(
    event_type smallint unsigned not null
        primary key,
    name       varchar(35)       not null
)
    collate = utf8_unicode_ci;

create table evergreen_items
(
    resolved_id  int unsigned     not null
        primary key,
    status       tinyint unsigned not null,
    time_added   int unsigned     not null,
    time_updated int unsigned     not null
)
    charset = utf8;

create index status_time_idx
    on evergreen_items (status, time_updated);

create table feed_domain_blacklist
(
    blacklist_domain_id bigint auto_increment
        primary key,
    domain_id           int unsigned      default 0 null,
    reason_id           smallint unsigned default 0 null,
    time_updated        int unsigned      default 0 null,
    constraint domain_idx
        unique (domain_id)
)
    collate = utf8_unicode_ci;

create table feed_global_recommendations
(
    global_rec_id    bigint unsigned auto_increment
        primary key,
    resolved_id      int unsigned                         not null,
    status           tinyint unsigned default 1           not null,
    time_added       int              default 0           null,
    impact_score     decimal(7, 4)                        null,
    save_cnt         int unsigned     default 0           null,
    domain_max_saves int unsigned                         null,
    true_save_cnt    int unsigned                         null,
    score            decimal(11, 4)                       null,
    top_domain_id    int unsigned                         null,
    title            varchar(200) collate utf8_unicode_ci null,
    constraint resolved_idx
        unique (resolved_id)
)
    charset = utf8;

create index domain_title_idx
    on feed_global_recommendations (top_domain_id, title);

create table feed_global_videos
(
    global_video_id bigint unsigned auto_increment
        primary key,
    resolved_id     int unsigned                         not null,
    status          tinyint unsigned default 1           not null,
    time_added      int              default 0           null,
    impact_score    decimal(7, 4)                        null,
    save_cnt        int unsigned     default 0           null,
    true_save_cnt   int unsigned                         null,
    score           decimal(11, 4)                       null,
    top_domain_id   int unsigned                         null,
    title           varchar(200) collate utf8_unicode_ci null,
    constraint resolved_idx
        unique (resolved_id)
)
    charset = utf8;

create index domain_title_idx
    on feed_global_videos (top_domain_id, title);

create table feed_item_blacklist
(
    blacklist_item_id bigint auto_increment
        primary key,
    resolved_id       int unsigned      default 0 null,
    reason_id         smallint unsigned default 0 null,
    time_updated      int unsigned      default 0 null,
    constraint resolved_idx
        unique (resolved_id)
)
    collate = utf8_unicode_ci;

create table feed_item_reports
(
    report_id    bigint auto_increment
        primary key,
    user_id      int unsigned                                 not null,
    session_id   int unsigned       default 0                 null,
    item_id      int unsigned       default 0                 null,
    api_id       mediumint unsigned default 0                 null,
    feed_item_id varchar(50)                                  null,
    reason_id    smallint unsigned  default 0                 null,
    time_updated int unsigned       default 0                 null,
    updated_at   timestamp          default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index feed_item_idx
    on feed_item_reports (feed_item_id);

create index reason_idx
    on feed_item_reports (reason_id);

create index time_idx
    on feed_item_reports (time_updated, reason_id);

create index updated_at
    on feed_item_reports (updated_at);

create index user_item
    on feed_item_reports (user_id, item_id);

create table feed_user_recommendations
(
    user_rec_id        bigint unsigned auto_increment
        primary key,
    user_id            int unsigned                        not null,
    resolved_id        int unsigned                        not null,
    feed_item_id       varchar(50) collate utf8_unicode_ci null,
    status             tinyint unsigned default 1          not null,
    time_added         int              default 0          null,
    impact_score       decimal(7, 4)                       null,
    save_cnt           int unsigned     default 0          null,
    similarity_sum     decimal(7, 4)                       null,
    adj_similarity_sum decimal(7, 4)                       null,
    constraint resolved_idx
        unique (user_id, resolved_id)
)
    charset = utf8;

create index feed_item_idx
    on feed_user_recommendations (feed_item_id);

create index resolved
    on feed_user_recommendations (resolved_id);

create index user_idx
    on feed_user_recommendations (user_id, status, user_rec_id);

create table feed_variants
(
    id         bigint unsigned auto_increment
        primary key,
    name       varchar(128)                        not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint name_idx
        unique (name)
)
    charset = utf8;

create table friend_joined_notification_log
(
    user_id      int unsigned not null
        primary key,
    user_ids     text         not null,
    time_created int unsigned not null,
    time_updated int unsigned not null
)
    charset = utf8;

create table friends
(
    friend_id  int unsigned auto_increment
        primary key,
    user_id    int unsigned                        not null,
    name       varchar(150)                        not null,
    email      varchar(150)                        not null,
    avatar_url varchar(300)                        not null,
    birth      int unsigned                        not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index birth
    on friends (birth);

create index email
    on friends (email);

create index updated_at
    on friends (updated_at);

create index user_id
    on friends (user_id);

create table galapagos_alpha_testers
(
    user_id      int unsigned               not null
        primary key,
    status       tinyint unsigned default 1 null,
    time_updated datetime                   not null
)
    collate = utf8_unicode_ci;

create table galaxy_gifts_track
(
    track_id       bigint auto_increment
        primary key,
    device_manuf   varchar(30)                            not null,
    device_model   varchar(30)                            not null,
    device_product varchar(30)                            not null,
    device_sid     varchar(100)                           not null,
    device_anid    varchar(100)                           not null,
    promotion_id   int unsigned                           not null,
    time_added     int unsigned default 0                 null,
    user_id        int unsigned                           not null,
    updated_at     timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index anid_idx
    on galaxy_gifts_track (device_anid);

create index device_idx
    on galaxy_gifts_track (device_manuf, device_model, device_product);

create index sid_idx
    on galaxy_gifts_track (device_sid);

create index updated_at
    on galaxy_gifts_track (updated_at);

create index user_idx
    on galaxy_gifts_track (user_id, promotion_id);

create table geo_ip
(
    geo_ip_id       bigint unsigned auto_increment
        primary key,
    ip              varchar(255)                       not null,
    lng_lat         point                              not null,
    country         varchar(255)                       null,
    subdivision0    varchar(255)                       null comment 'States in the US',
    city            varchar(255)                       null,
    city_geoname_id bigint unsigned                    null,
    accuracy_radius int(10)                            null,
    timezone        varchar(255)                       null,
    postal_code     varchar(255)                       null,
    metro_code      int(10)                            null,
    time_created    datetime default CURRENT_TIMESTAMP not null,
    time_updated    datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint ix_ip
        unique (ip(191))
)
    collate = utf8mb4_bin;

create index ix_city_geoname_id
    on geo_ip (city_geoname_id);

create index ix_country_city
    on geo_ip (country(191), city(191));

create index ix_postal_code
    on geo_ip (postal_code(191));

create index ix_time_created
    on geo_ip (time_created);

create index ix_time_updated
    on geo_ip (time_updated);

create table google_tokens
(
    id           int unsigned auto_increment
        primary key,
    access_token varchar(255) not null,
    time_added   int unsigned not null,
    time_expires int unsigned not null
)
    collate = utf8_unicode_ci;

create table guid_locale
(
    guid       bigint unsigned                     not null,
    api_id     mediumint unsigned                  not null,
    locale     varchar(5) collate utf8_unicode_ci  not null,
    country    varchar(5) collate utf8_unicode_ci  not null,
    language   varchar(10) collate utf8_unicode_ci not null,
    birth      datetime                            not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (guid, api_id)
)
    charset = utf8;

create index country_idx
    on guid_locale (country);

create index locale_idx
    on guid_locale (locale);

create index updated_at
    on guid_locale (updated_at);

create table honeypot_failures
(
    ip_address bigint       not null,
    username   varchar(255) not null,
    count      int unsigned null,
    first      datetime     null,
    last       datetime     null,
    primary key (ip_address, username)
);

create table ios_transaction_error_log
(
    log_id                  bigint unsigned auto_increment
        primary key,
    user_id                 int unsigned                  not null,
    product_id              varchar(255) collate utf8_bin not null,
    original_transaction_id bigint unsigned               not null,
    transaction_id          bigint unsigned               not null,
    web_order_line_item_id  bigint unsigned               not null,
    purchase_date           int unsigned                  not null,
    expire_date             int unsigned                  not null,
    cancel_date             int unsigned                  not null,
    object                  text                          not null,
    line_item_type          varchar(40)                   not null,
    time_added              int unsigned                  not null,
    livemode                tinyint unsigned default 0    null
)
    collate = utf8_unicode_ci;

create index original_transaction_id
    on ios_transaction_error_log (original_transaction_id);

create index user_idx
    on ios_transaction_error_log (user_id, livemode);

create index web_order_line_item_idx
    on ios_transaction_error_log (web_order_line_item_id);

create table ios_transaction_log
(
    log_id                  bigint unsigned auto_increment
        primary key,
    user_id                 int unsigned                  not null,
    product_id              varchar(255) collate utf8_bin not null,
    original_transaction_id bigint unsigned               not null,
    transaction_id          bigint unsigned               not null,
    web_order_line_item_id  bigint unsigned               not null,
    purchase_date           int unsigned                  not null,
    expire_date             int unsigned                  not null,
    cancel_date             int unsigned                  not null,
    object                  text                          not null,
    line_item_type          varchar(40)                   not null,
    time_added              int unsigned                  not null,
    livemode                tinyint unsigned default 0    null,
    constraint transaction_idx
        unique (transaction_id)
)
    collate = utf8_unicode_ci;

create index original_transaction_id
    on ios_transaction_log (original_transaction_id);

create index user_idx
    on ios_transaction_log (user_id, livemode);

create index web_order_line_item_idx
    on ios_transaction_log (web_order_line_item_id);

create table item_ads
(
    user_id       int unsigned                        not null,
    item_id       int unsigned                        not null,
    impression_id varchar(50) collate utf8_unicode_ci not null,
    time_added    int unsigned default 0              null,
    primary key (user_id, item_id)
)
    charset = utf8;

create index impression_idx
    on item_ads (impression_id);

create table item_attribution
(
    attribution_id      int unsigned auto_increment
        primary key,
    user_id             int unsigned               not null,
    item_id             int unsigned               not null,
    attribution_type_id int unsigned               not null,
    profile_name        varchar(50)                null,
    profile_contact     varchar(100)               null,
    profile_image       text                       null,
    source_id           varchar(100)               null,
    attribution_time    int                        null,
    data                mediumtext                 null,
    api_id              mediumint unsigned         null,
    status              tinyint unsigned default 1 not null,
    time_added          int                        null
)
    collate = utf8mb4_bin;

create index attribution_source_idx
    on item_attribution (attribution_type_id, source_id);

create index user_id
    on item_attribution (user_id, item_id);

create table item_currently_reading
(
    user_id     int unsigned                        not null,
    item_id     int unsigned                        not null,
    should_hide tinyint                             not null,
    updated_at  timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, item_id)
)
    charset = utf8;

create index updated_at
    on item_currently_reading (updated_at);

create table item_grouping_dynamic
(
    resolved_id    int unsigned             not null,
    grouping_id    bigint unsigned          not null,
    source_score   decimal(21, 20) unsigned not null,
    date_published date                     not null,
    primary key (resolved_id, grouping_id)
)
    charset = utf8;

create index date_idx
    on item_grouping_dynamic (date_published);

create index grouping_idx
    on item_grouping_dynamic (grouping_id);

create table item_groupings
(
    user_id     int unsigned    not null,
    item_id     int unsigned    not null,
    grouping_id bigint unsigned not null,
    primary key (user_id, item_id)
)
    charset = utf8;

create index user_id
    on item_groupings (user_id, grouping_id);

create table item_session
(
    id                       bigint auto_increment
        primary key,
    item_session_id          int unsigned       not null,
    app_session_id           int unsigned       not null,
    guid                     bigint unsigned    not null,
    item_id                  int unsigned       not null,
    user_id                  bigint unsigned    not null,
    api_id                   mediumint unsigned not null,
    referral_view_segment_id int unsigned       null,
    start_time               datetime           not null,
    end_time                 datetime           null,
    seconds                  int unsigned       null,
    constraint session_guid_item
        unique (app_session_id, guid, item_id)
)
    collate = utf8_unicode_ci;

create index api_id
    on item_session (api_id);

create index end_time
    on item_session (end_time);

create index guid
    on item_session (guid);

create index item_id
    on item_session (item_id);

create index item_session_id
    on item_session (item_session_id);

create index ref_id
    on item_session (referral_view_segment_id);

create index seconds
    on item_session (seconds);

create index start_time
    on item_session (start_time);

create index user_id
    on item_session (user_id);

create table `readitla_ril-tmp`.item_tags
(
    user_id        int unsigned                           not null,
    item_id        int unsigned                           not null,
    tag            varchar(25) charset utf8mb4 default '' not null,
    entered_by     varchar(42) charset latin1             not null,
    status         tinyint unsigned            default 1  not null,
    time_added     datetime                               null,
    api_id         mediumint unsigned                     null,
    time_updated   datetime                               null,
    api_id_updated mediumint unsigned                     null,
    id             bigint                                 auto_increment,
    primary key (user_id, item_id, tag),
    constraint id
        unique (id)
)
    collate = utf8_unicode_ci
    KEY_BLOCK_SIZE = 8
    row_format = COMPRESSED;

create index tag
    on item_tags (tag(15), item_id);

create index userStatusTime
    on item_tags (user_id, status, time_updated);

create table item_time_spent
(
    user_id       int unsigned                        not null,
    item_id       int unsigned                        not null,
    view          tinyint unsigned                    not null,
    time_spent    int unsigned                        not null,
    session_count smallint unsigned                   not null,
    updated_at    timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, item_id, view)
)
    charset = utf8;

create index updated_at
    on item_time_spent (updated_at);

create table items_scroll
(
    user_id        int unsigned                        not null,
    item_id        int unsigned                        not null,
    view           tinyint unsigned                    not null,
    section        tinyint                             not null,
    page           tinyint unsigned                    not null,
    node_index     smallint unsigned                   not null,
    scroll_percent tinyint unsigned                    not null,
    time_updated   datetime                            not null,
    updated_at     timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, item_id, view)
);

create index time_updated
    on items_scroll (time_updated);

create index updated_at
    on items_scroll (updated_at);

create table jobs
(
    id         int unsigned auto_increment
        primary key,
    handler    mediumtext                     not null,
    queue      varchar(255) default 'default' not null,
    attempts   int unsigned default 0         not null,
    run_at     datetime                       null,
    locked_at  datetime                       null,
    locked_by  varchar(255)                   null,
    failed_at  datetime                       null,
    error      text                           null,
    created_at datetime                       not null
)
    collate = utf8mb4_bin;

create index ix_created_at
    on jobs (created_at);

create index ix_queue
    on jobs (queue(191));

create index ix_run_at
    on jobs (run_at);

create table likes
(
    like_id     bigint unsigned auto_increment
        primary key,
    share_id    int unsigned       not null,
    user_id     int unsigned       not null,
    api_id      mediumint unsigned not null,
    time_posted bigint unsigned    not null,
    constraint user_share
        unique (user_id, share_id)
)
    collate = utf8_unicode_ci;

create index share_id
    on likes (share_id, time_posted);

create table list
(
    user_id        int unsigned               not null,
    item_id        int unsigned               not null,
    resolved_id    int unsigned               not null,
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

create index api_id
    on list (api_id);

create index api_id_updated
    on list (api_id_updated);

create index item_id
    on list (item_id);

create index resolved_id
    on list (resolved_id);

create index time_added
    on list (time_added);

create index time_updated
    on list (time_updated);

create index userStatusTime
    on list (user_id, status, time_updated);

create index userTimeAdded
    on list (user_id, status, time_added);

create index userTimeFavorited
    on list (user_id, favorite, time_favorited);

create index userTimeRead
    on list (user_id, status, time_read);

create index user_id
    on list (user_id, status, item_id);

create table list_extras
(
    user_id           int unsigned     not null,
    item_id           int unsigned     not null,
    has_pending_share tinyint unsigned not null,
    primary key (user_id, item_id)
)
    collate = utf8_unicode_ci;

create index userItemPending
    on list_extras (user_id, item_id, has_pending_share);

create table list_meta
(
    user_id    int unsigned                        not null,
    item_id    int unsigned                        not null,
    meta_id    smallint unsigned                   not null,
    value      text collate utf8_unicode_ci        not null,
    api_id     mediumint unsigned                  not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
);

create index item_id
    on list_meta (item_id);

create index meta_id
    on list_meta (meta_id);

create index updated_at
    on list_meta (updated_at);

create index user_item_meta_idx
    on list_meta (user_id, item_id, meta_id);

create table list_shares
(
    user_id  int unsigned not null,
    item_id  int unsigned not null,
    share_id int unsigned not null,
    primary key (user_id, item_id, share_id)
)
    collate = utf8_unicode_ci;

create table log_login_data
(
    id         int auto_increment
        primary key,
    ip         varchar(50) collate utf8_unicode_ci  not null,
    email      varchar(150) collate utf8_unicode_ci not null,
    user_agent varchar(255) collate utf8_unicode_ci null,
    lang       varchar(255) collate utf8_unicode_ci null,
    success    tinyint(1) unsigned                  null,
    updated_at timestamp default CURRENT_TIMESTAMP  not null on update CURRENT_TIMESTAMP
)
    charset = utf8;

create index email_idx
    on log_login_data (email);

create index ip_idx
    on log_login_data (ip);

create index success_idx
    on log_login_data (success);

create table log_overflow_action_data
(
    id             int unsigned auto_increment
        primary key,
    user_id        int unsigned                                not null,
    item_id        int unsigned                                not null,
    api_id         mediumint unsigned                          not null,
    action_type_id smallint unsigned                           not null,
    content        mediumtext collate utf8mb4_bin              null,
    user_agent     varchar(255) collate utf8mb4_bin            null,
    blocked        smallint unsigned default 0                 null,
    updated_at     timestamp         default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    charset = utf8;

create index action_type_idx
    on log_overflow_action_data (action_type_id);

create index api_idx
    on log_overflow_action_data (api_id);

create index user_idx
    on log_overflow_action_data (user_id);

create table login_failures
(
    user_id    int(11) unsigned not null,
    ip_address bigint unsigned  not null,
    date       int              not null
)
    collate = utf8_unicode_ci;

create index date
    on login_failures (date);

create index ip_address
    on login_failures (ip_address);

create index user_id
    on login_failures (user_id);

create table login_meta
(
    user_id      int(11) unsigned not null
        primary key,
    first_fail   int              null,
    fail_count   int default 0    null,
    ip_whitelist text             null
)
    collate = utf8_unicode_ci;

create table message_templates
(
    message_template_id  mediumint unsigned auto_increment
        primary key,
    internal_description varchar(100)                   null,
    message_ui_id        mediumint unsigned             not null,
    title                varchar(255)                   null,
    message              varchar(255)                   null,
    buttons              text                           null,
    requirements         text                           null,
    single_use           tinyint(4) unsigned default 1  null,
    priority             tinyint(4) unsigned default 10 null
)
    collate = utf8_unicode_ci;

create table messages
(
    message_id          bigint auto_increment
        primary key,
    message_template_id mediumint unsigned                            not null,
    user_id             int unsigned                                  not null,
    info                text                                          null,
    created_date        datetime                                      not null,
    expiration_date     datetime                                      not null,
    is_active           tinyint(4) unsigned default 0                 null,
    updated_at          timestamp           default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index message_template_idx
    on messages (message_template_id);

create index updated_at
    on messages (updated_at);

create index user_created_priority
    on messages (user_id, created_date, is_active);

create table mozilla_users_to_upgrade
(
    id                   int unsigned auto_increment
        primary key,
    email                varchar(150) collate utf8_unicode_ci          not null,
    user_id              int unsigned                                  null,
    processed            tinyint(1) unsigned default 0                 null,
    already_premium      tinyint(1) unsigned default 0                 null,
    user_subscription_id int unsigned                                  null,
    updated_at           timestamp           default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint email_idx
        unique (email),
    constraint user_id_idx
        unique (user_id)
)
    charset = utf8;

create index already_premium_idx
    on mozilla_users_to_upgrade (already_premium);

create index processed_idx
    on mozilla_users_to_upgrade (processed);

create index user_subscription_idx
    on mozilla_users_to_upgrade (user_subscription_id);

create table newsletter_subscribers
(
    id                 bigint unsigned auto_increment
        primary key,
    email              varchar(500)                                                      not null,
    email_hash         varchar(64) charset latin1                                        not null,
    external_key       char(10) collate latin1_bin                                       not null,
    frequency          enum ('daily', 'triweekly', 'weekly', 'monthly') charset latin1   null,
    status             enum ('unconfirmed', 'subscribed', 'unsubscribed') charset latin1 null,
    unsubscribe_reason varchar(255)                                                      null,
    created_at         timestamp default CURRENT_TIMESTAMP                               not null,
    updated_at         timestamp default CURRENT_TIMESTAMP                               not null,
    track_source       varchar(255) charset latin1                                       null,
    track_campaign     varchar(255) charset latin1                                       null,
    track_medium       varchar(255) charset latin1                                       null,
    user_id            int unsigned                                                      null,
    constraint email_hash_idx
        unique (email_hash),
    constraint user_id_idx
        unique (user_id),
    constraint uuid_idx
        unique (external_key)
)
    collate = utf8mb4_bin;

create index email_idx
    on newsletter_subscribers (email(191));

create index status_idx
    on newsletter_subscribers (status);

create table notification_campaign
(
    campaign_key varchar(50) default '' not null
        primary key,
    name         varchar(100)           null,
    template     text                   null
)
    collate = utf8mb4_bin;

create table notification_services
(
    service_id tinyint unsigned not null
        primary key,
    name       varchar(30)      not null
)
    collate = utf8_unicode_ci;

create table notification_template
(
    id   int unsigned auto_increment
        primary key,
    name varchar(50) null
)
    collate = utf8_unicode_ci;

create table notification_template_data
(
    id                   int unsigned auto_increment
        primary key,
    user_notification_id int unsigned not null,
    template_data        mediumtext   not null
)
    collate = utf8mb4_bin;

create index ix_user_notification_id
    on notification_template_data (user_notification_id);

create table oauth_requests
(
    consumer_key  varchar(30)       not null,
    request_token varchar(30)       not null,
    access_token  varchar(30)       null,
    user_meta     varchar(150)      null,
    redirect_uri  varchar(255)      not null,
    state         varchar(255)      not null,
    permission    varchar(3)        null,
    time_created  datetime          null,
    status        tinyint default 1 null
)
    collate = utf8_unicode_ci;

create index access_idx
    on oauth_requests (consumer_key, access_token);

create index access_token_idx
    on oauth_requests (access_token);

create index auth_idx
    on oauth_requests (consumer_key, request_token);

create index request_token_idx
    on oauth_requests (request_token);

create table oauth_user_access
(
    user_id      int unsigned      not null,
    consumer_key varchar(30)       not null,
    access_token varchar(30)       not null,
    permission   varchar(3)        null,
    status       tinyint default 0 null
)
    collate = utf8_unicode_ci;

create index access_idx
    on oauth_user_access (access_token);

create index consumer_idx
    on oauth_user_access (consumer_key, access_token);

create index user_idx
    on oauth_user_access (user_id, consumer_key, status);

create index user_status_idx
    on oauth_user_access (user_id, status);

create table payment_products
(
    id               int unsigned auto_increment
        primary key,
    created_at       timestamp           default CURRENT_TIMESTAMP               not null,
    updated_at       timestamp           default CURRENT_TIMESTAMP               not null,
    store            enum ('ios', 'mac', 'google', 'stripe', 'paypal', 'amazon') not null,
    vendor_id        varchar(255)                                                not null,
    account_id       varchar(255)                                                null,
    test_mode        tinyint(1) unsigned default 0                               not null,
    product_interval enum ('month', 'year')                                      null,
    constraint unique_product
        unique (store, vendor_id(150))
)
    collate = utf8mb4_unicode_ci;

create table payment_subscriptions
(
    id          int unsigned auto_increment
        primary key,
    created_at  timestamp           default CURRENT_TIMESTAMP not null,
    updated_at  timestamp           default CURRENT_TIMESTAMP not null,
    vendor_id   varchar(255)                                  not null,
    product_id  int unsigned                                  not null,
    user_id     int unsigned                                  not null,
    active      tinyint(1) unsigned default 0                 not null,
    amount      int unsigned                                  null,
    currency    varchar(5)                                    null,
    expires_at  datetime                                      null,
    vendor_data text                                          null,
    constraint unique_subscription
        unique (user_id, vendor_id(150), product_id)
)
    collate = utf8mb4_unicode_ci;

create table paypal_transaction_error_log
(
    log_id         bigint unsigned auto_increment
        primary key,
    txn_id         varchar(50)  null,
    payer_email    varchar(150) null,
    receiver_email varchar(150) null,
    raw_data       text         null
)
    collate = utf8mb4_bin;

create index txn_idx
    on paypal_transaction_error_log (txn_id);

create table paypal_transaction_log
(
    log_id         bigint unsigned auto_increment
        primary key,
    txn_id         varchar(50)  null,
    payer_email    varchar(150) null,
    receiver_email varchar(150) null,
    mc_gross       varchar(30)  null,
    mc_fee         varchar(30)  null,
    mc_currency    varchar(10)  null,
    raw_data       text         null
)
    collate = utf8mb4_bin;

create index txn_idx
    on paypal_transaction_log (txn_id);

create table pocket_hits_content
(
    id                      int auto_increment
        primary key,
    content_id              int unsigned                null,
    headline                varchar(255)                null,
    author                  varchar(255)                null,
    author_twitter          varchar(45)                 null,
    publication             varchar(255)                null,
    publication_twitter     varchar(45)                 null,
    save_count              int unsigned                null,
    impact_score            float                       null,
    link                    varchar(255)                null,
    link_short              varchar(255)                null,
    link_campaign           varchar(255)                null,
    first_seen              bit                         null,
    post_date               datetime                    null,
    tweet                   text                        null,
    sub_headline            varchar(255)                null,
    author_publisher        varchar(255)                null,
    blurb                   text                        null,
    blurb2                  text                        null,
    shares                  int default 0               null,
    retweets                int default 0               null,
    favorites               int default 0               null,
    clicks_image            int default 0               null,
    clicks_title            int default 0               null,
    clicks_save             int default 0               null,
    image                   varchar(255) charset latin1 null,
    publisher_id            int(10)                     not null,
    pocket_hits_email_id    int                         not null,
    pocket_hits_prospect_id int(11) unsigned            null,
    email_nickname          varchar(255)                null,
    email_position          int                         null,
    sponsored               smallint(5)                 null
)
    collate = utf8_unicode_ci;

create index email_id
    on pocket_hits_content (pocket_hits_email_id);

create table pocket_hits_email
(
    id          int auto_increment
        primary key,
    campaign_id int                                                null,
    tests       text                                               null,
    footer      text                                               null,
    experiments text                                               null,
    comments    text                                               null,
    draft_data  longtext                                           null,
    created     datetime                                           null,
    status      enum ('draft', 'active') default 'active'          not null,
    access_key  varchar(255)                                       null,
    updated_at  timestamp                default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index updated_at
    on pocket_hits_email (updated_at);

create table pocket_hits_email_for_portal_processed
(
    id         int                                 not null
        primary key,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index updated_at
    on pocket_hits_email_for_portal_processed (updated_at);

create table pocket_hits_prospects
(
    id                  int(11) unsigned auto_increment
        primary key,
    content_id          int unsigned                                                    not null,
    type                enum ('impact', 'saves', 'trending', 'video', 'long', 'custom') null,
    headline            varchar(255)                                                    null,
    author              varchar(255)                                                    null,
    author_twitter      varchar(255)                                                    null,
    publication         varchar(255)                                                    null,
    publication_twitter varchar(255)                                                    null,
    save_count          int unsigned                                                    null,
    impact_score        float                                                           null,
    long_link           varchar(255)                                                    null,
    publication_time    datetime                                                        null,
    date_added          date                                                            null,
    used                bit default b'0'                                                null,
    publisher_id        int(10)                                                         null,
    images              text                                                            null,
    vid                 varchar(45)                                                     null,
    word_count          int                                                             null,
    constraint id_UNIQUE
        unique (id)
)
    collate = utf8_unicode_ci;

create index content_id
    on pocket_hits_prospects (content_id);

create index date_added
    on pocket_hits_prospects (date_added);

create index impact_score
    on pocket_hits_prospects (impact_score);

create index save_count
    on pocket_hits_prospects (save_count);

create index type
    on pocket_hits_prospects (type);

create table pocket_hits_tests
(
    id                   int auto_increment
        primary key,
    pocket_hits_email_id int          null,
    subject              varchar(255) null,
    header               varchar(255) null,
    sub_header           varchar(255) null
)
    collate = utf8_unicode_ci;

create index email_id
    on pocket_hits_tests (pocket_hits_email_id);

create table post_action_reason
(
    post_action_id bigint unsigned   not null
        primary key,
    reason_id      smallint unsigned not null,
    time_added     int unsigned      not null
)
    collate = utf8_unicode_ci;

create index reason_idx
    on post_action_reason (reason_id);

create table post_actions
(
    post_action_id bigint unsigned auto_increment
        primary key,
    post_id        int unsigned      not null,
    user_id        int unsigned      not null,
    action_type_id smallint unsigned not null,
    time_added     int unsigned      not null,
    constraint post_user_idx
        unique (post_id, action_type_id, user_id)
)
    collate = utf8_unicode_ci;

create index user_idx
    on post_actions (user_id, action_type_id);

create table post_url_items
(
    post_id int unsigned not null,
    item_id int unsigned not null,
    primary key (post_id, item_id)
)
    collate = utf8_unicode_ci;

create index item_id
    on post_url_items (item_id);

create table projectx_feed_items
(
    feed_item_id bigint unsigned                     not null
        primary key,
    user_id      int unsigned                        not null,
    resolved_id  int unsigned                        not null,
    reason_type  varchar(35) collate utf8_unicode_ci null,
    reason_id    int unsigned                        null,
    post_id      int unsigned                        null,
    status       tinyint unsigned default 0          not null,
    time_created int              default 0          null,
    time_sent    int              default 0          null,
    time_viewed  int              default 0          null,
    constraint dummy_idx
        unique (user_id, resolved_id, reason_type, reason_id, time_created)
)
    charset = utf8;

create index user_feed_idx
    on projectx_feed_items (user_id, feed_item_id);

create index user_status_idx
    on projectx_feed_items (user_id, status);

create index user_status_view_idx
    on projectx_feed_items (user_id, status, time_viewed);

create index user_time_status_idx
    on projectx_feed_items (user_id, time_created, status);

create table projectx_feed_items_viewed
(
    user_id      int unsigned    not null,
    max_id       bigint unsigned not null,
    min_id       bigint unsigned not null,
    time_updated int unsigned    not null
)
    charset = utf8;

create index user_idx
    on projectx_feed_items_viewed (user_id, time_updated);

create table projectx_friends
(
    user_id          int unsigned                  not null,
    friend_user_id   int unsigned                  not null,
    following_status tinyint(1) unsigned default 1 null,
    time_created     int unsigned                  not null,
    time_updated     int unsigned                  not null,
    primary key (user_id, friend_user_id)
)
    collate = utf8_unicode_ci;

create index friend_idx
    on projectx_friends (friend_user_id, user_id, following_status);

create index friend_user_idx
    on projectx_friends (friend_user_id);

create table projectx_friends_tags
(
    user_id          int unsigned                  not null,
    friend_user_id   int unsigned                  not null,
    tag              varchar(25)                   not null,
    following_status tinyint(1) unsigned default 0 null,
    time_created     int unsigned                  not null,
    time_updated     int unsigned                  not null,
    primary key (user_id, friend_user_id, tag)
)
    collate = utf8_unicode_ci;

create index collection_user_tag_idx
    on projectx_friends_tags (friend_user_id, tag);

create table projectx_modules
(
    module_id         int unsigned auto_increment
        primary key,
    name              varchar(100) collate utf8_unicode_ci not null,
    module_type_id    int unsigned                         not null,
    topic_grouping_id bigint unsigned                      null,
    name_string       varchar(100) collate utf8_unicode_ci not null,
    color             varchar(10) collate utf8_unicode_ci  not null,
    icon_url_1x       varchar(300) collate utf8_unicode_ci not null,
    icon_url_2x       varchar(300) collate utf8_unicode_ci not null,
    icon_url_3x       varchar(300) collate utf8_unicode_ci not null,
    name_string_alt   varchar(100) collate utf8_unicode_ci null,
    color_alt         varchar(10) collate utf8_unicode_ci  null,
    icon_url_1x_alt   varchar(300) collate utf8_unicode_ci null,
    icon_url_2x_alt   varchar(300) collate utf8_unicode_ci null,
    icon_url_3x_alt   varchar(300) collate utf8_unicode_ci null
)
    charset = utf8;

create table projectx_notifications
(
    notification_id int unsigned auto_increment
        primary key,
    user_id         int unsigned               not null,
    action_type_id  tinyint unsigned           not null,
    action_id       int unsigned               not null,
    action_user_id  int unsigned               not null,
    delivery_status tinyint unsigned default 0 null,
    read_status     tinyint unsigned default 0 null,
    time_added      int unsigned               not null
)
    collate = utf8_unicode_ci;

create index user_del_time_idx
    on projectx_notifications (user_id, delivery_status, time_added);

create index user_time_idx
    on projectx_notifications (user_id, time_added);

create table projectx_post_comments
(
    comment_id int unsigned auto_increment
        primary key,
    post_id    int unsigned not null,
    user_id    int unsigned not null,
    comment    text         null,
    time_added int unsigned not null
)
    collate = utf8_unicode_ci;

create index post_user_idx
    on projectx_post_comments (post_id, user_id);

create index user_idx
    on projectx_post_comments (user_id);

create table projectx_post_likes
(
    like_id    int unsigned auto_increment
        primary key,
    post_id    int unsigned not null,
    user_id    int unsigned not null,
    time_added int unsigned not null,
    constraint post_user_idx
        unique (post_id, user_id)
)
    collate = utf8_unicode_ci;

create index user_idx
    on projectx_post_likes (user_id);

create table projectx_post_reposts
(
    repost_id  int unsigned auto_increment
        primary key,
    post_id    int unsigned not null,
    user_id    int unsigned not null,
    time_added int unsigned not null,
    constraint post_user_idx
        unique (post_id, user_id)
)
    collate = utf8_unicode_ci;

create index user_idx
    on projectx_post_reposts (user_id);

create table projectx_post_stats
(
    post_id     int unsigned                 not null
        primary key,
    like_cnt    mediumint unsigned default 0 not null,
    repost_cnt  mediumint unsigned default 0 not null,
    comment_cnt mediumint unsigned default 0 not null
)
    collate = utf8_unicode_ci;

create table projectx_post_tags
(
    tag_id     int unsigned auto_increment
        primary key,
    post_id    int unsigned not null,
    tag        varchar(25)  not null,
    time_added int unsigned not null,
    constraint post_id
        unique (post_id, tag)
)
    collate = utf8_unicode_ci;

create table projectx_posted_items
(
    post_id          int unsigned auto_increment
        primary key,
    user_id          int unsigned                           not null,
    item_id          int unsigned                           not null,
    feed_item_id     varchar(50)                            null,
    original_post_id int unsigned default 0                 null,
    comment          mediumtext                             null,
    quote            mediumtext                             null,
    time_shared      int unsigned                           not null,
    api_id           mediumint unsigned                     not null,
    status           tinyint(1)   default 0                 not null,
    updated_at       timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8mb4_bin;

create index feed_item_idx
    on projectx_posted_items (feed_item_id);

create index item_id
    on projectx_posted_items (item_id);

create index original_post_idx
    on projectx_posted_items (original_post_id);

create index time_shared_idx
    on projectx_posted_items (time_shared);

create index updated_at
    on projectx_posted_items (updated_at);

create index user_item
    on projectx_posted_items (user_id, item_id);

create table projectx_posted_items_to_update
(
    post_id          int unsigned auto_increment
        primary key,
    user_id          int unsigned                           not null,
    item_id          int unsigned                           not null,
    feed_item_id     varchar(50)                            null,
    original_post_id int unsigned default 0                 null,
    comment          mediumtext                             null,
    quote            mediumtext                             null,
    time_shared      int unsigned                           not null,
    api_id           mediumint unsigned                     not null,
    status           tinyint(1)   default 0                 not null,
    updated_at       timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8mb4_bin;

create index feed_item_idx
    on projectx_posted_items_to_update (feed_item_id);

create index item_id
    on projectx_posted_items_to_update (item_id);

create index original_post_idx
    on projectx_posted_items_to_update (original_post_id);

create index time_shared_idx
    on projectx_posted_items_to_update (time_shared);

create index updated_at
    on projectx_posted_items_to_update (updated_at);

create index user_item
    on projectx_posted_items_to_update (user_id, item_id);

create table projectx_subscriptions
(
    user_id            int unsigned                                             not null,
    subscriber_user_id int unsigned                                             not null,
    status             enum ('subscribed', 'unsubscribed') default 'subscribed' null,
    created            datetime                                                 null,
    updated            datetime                                                 null,
    primary key (user_id, subscriber_user_id)
)
    collate = utf8_unicode_ci;

create index subscriber_user_idx
    on projectx_subscriptions (subscriber_user_id);

create table projectx_topic_grouping
(
    grouping_id   bigint unsigned                      not null
        primary key,
    grouping_name varchar(100) collate utf8_unicode_ci not null,
    display_name  varchar(100) collate utf8_unicode_ci not null
)
    charset = utf8;

create table projectx_topic_grouping_mapping
(
    parent_grouping_id bigint unsigned not null,
    sub_grouping_id    bigint unsigned not null,
    primary key (parent_grouping_id, sub_grouping_id)
)
    charset = utf8;

create index sub_idx
    on projectx_topic_grouping_mapping (sub_grouping_id);

create table projectx_twitter_accounts
(
    user_id            int unsigned                                             not null,
    twitter_id         bigint unsigned                                          not null,
    screen_name        varchar(20)                                              not null,
    status             enum ('authorized', 'deauthorized') default 'authorized' null,
    oauth_token        varchar(255)                                             null,
    oauth_token_secret varchar(255)                                             null,
    created            datetime                                                 null,
    updated            datetime                                                 null,
    date_deauthorized  datetime                                                 null,
    primary key (user_id, twitter_id)
)
    collate = utf8_unicode_ci;

create index twitter_idx
    on projectx_twitter_accounts (twitter_id, user_id);

create table projectx_twitter_subscriptions
(
    subscriber_user_id int unsigned               not null,
    twitter_id         bigint unsigned            not null,
    screen_name        varchar(255)               not null,
    name               varchar(255)               not null,
    profile_image_url  varchar(255)               not null,
    status             tinyint unsigned default 1 null,
    created            datetime                   null,
    updated            datetime                   null,
    primary key (subscriber_user_id, twitter_id)
)
    collate = utf8_unicode_ci;

create table projectx_user_feed
(
    user_feed_id           bigint unsigned auto_increment
        primary key,
    user_id                int unsigned           not null,
    resolved_id            int unsigned           not null,
    module_id              int unsigned           not null,
    post_id                int unsigned           null,
    reposter_user_id       int unsigned           null,
    sort_time              int          default 0 null,
    added_hour_id          int          default 0 null,
    dummy_post_id          int unsigned default 0 not null,
    dummy_reposter_user_id int unsigned default 0 not null,
    constraint dummy_idx
        unique (user_id, resolved_id, dummy_post_id, dummy_reposter_user_id)
)
    charset = utf8;

create index user_feed_idx
    on projectx_user_feed (user_id, user_feed_id);

create index user_idx
    on projectx_user_feed (user_id, resolved_id, module_id);

create index user_sort_idx
    on projectx_user_feed (user_id, sort_time);

create table projectx_users
(
    user_id                  int unsigned       not null
        primary key,
    apple_id                 varchar(150)       not null,
    name                     varchar(50)        not null,
    beta_wave                mediumint unsigned not null,
    time_added               int                not null,
    time_refreshed           int default 0      null,
    time_refreshed_relevance int default 0      null
)
    collate = utf8_unicode_ci;

create table promotion_codes
(
    promotion_id  int unsigned               not null,
    code          varchar(50)                not null
        primary key,
    status        tinyint unsigned default 0 null,
    time_redeemed int unsigned     default 0 null,
    user_id       int unsigned               null,
    created_at    timestamp                  null,
    updated_at    timestamp                  null,
    created_by    int unsigned               null
)
    collate = utf8_unicode_ci;

create index promotion_user_idx
    on promotion_codes (promotion_id, user_id);

create table promotions
(
    promotion_id      int unsigned auto_increment
        primary key,
    name              varchar(50)                   not null,
    code              varchar(50)                   not null,
    ab_test_name      varchar(40)                   not null,
    duration_in_days  smallint unsigned   default 0 null,
    is_unique         tinyint(1) unsigned default 1 null,
    is_ccrequired     tinyint(1) unsigned default 1 null,
    subscription_info varchar(100)                  null,
    time_start        int unsigned        default 0 null,
    time_end          int unsigned        default 0 null,
    status            tinyint unsigned    default 0 null
)
    collate = utf8_unicode_ci;

create index status_idx
    on promotions (status);

create table publisher
(
    id              int unsigned auto_increment
        primary key,
    name            varchar(50)       not null,
    domain_id       int unsigned      not null,
    active          tinyint default 0 null,
    data_start_time int unsigned      null
)
    collate = utf8_unicode_ci;

create index active_idx
    on publisher (active);

create index domain_idx
    on publisher (domain_id);

create table publisher_domain
(
    publisher_id        int unsigned      not null,
    domain_id           int unsigned      not null,
    verified            tinyint default 0 null,
    verification_method tinyint default 0 null,
    verified_time       int unsigned      not null,
    primary key (publisher_id, domain_id)
)
    collate = utf8_unicode_ci;

create index domain_idx
    on publisher_domain (domain_id);

create table publisher_domain_accounts
(
    publisher_account_id int unsigned auto_increment
        primary key,
    publisher_id         int unsigned                  not null,
    domain_id            int unsigned                  not null,
    name                 varchar(75)                   not null,
    twitter              varchar(20)                   not null,
    twitter_verified     tinyint(1) unsigned           not null,
    logo_url             varchar(255)                  not null,
    verified             tinyint(1) unsigned           not null,
    verification_method  tinyint(1) unsigned           not null,
    time_verified        datetime                      null,
    data_status          tinyint(1) unsigned default 0 null,
    created_by_user_id   int unsigned                  not null,
    birth                datetime                      null
)
    collate = utf8_unicode_ci;

create index domain_id
    on publisher_domain_accounts (domain_id, verified);

create index publisher_id
    on publisher_domain_accounts (publisher_id);

create index verified_data_idx
    on publisher_domain_accounts (verified, data_status);

create table publisher_domain_survey
(
    publisher_account_id int unsigned not null,
    value                varchar(75)  not null,
    primary key (publisher_account_id, value)
)
    collate = utf8_unicode_ci;

create index value
    on publisher_domain_survey (value);

create table publisher_message_links
(
    link_id        int unsigned auto_increment
        primary key,
    message_id     int unsigned        not null,
    placeholder_id tinyint(1) unsigned not null,
    url            text                not null
)
    collate = utf8_unicode_ci;

create index message_id
    on publisher_message_links (message_id);

create table publisher_messages
(
    message_id           int unsigned auto_increment
        primary key,
    publisher_account_id int unsigned        not null,
    name                 varchar(45)         not null,
    raw_html             text                not null,
    template_html        text                not null,
    created_by_user_id   int unsigned        not null,
    edited_by_user_id    int unsigned        not null,
    time_created         datetime            null,
    time_edited          datetime            null,
    time_activated       datetime            null,
    time_deactivated     datetime            null,
    active               tinyint(1) unsigned not null,
    approved             tinyint(1) unsigned not null,
    approved_by          int unsigned        not null,
    time_approved        datetime            null
)
    collate = utf8_unicode_ci;

create index publisher_account_id
    on publisher_messages (publisher_account_id, active, approved);

create table publisher_users
(
    publisher_account_id int unsigned        not null,
    user_id              int unsigned        not null,
    role                 tinyint(1) unsigned not null,
    status               tinyint(1) unsigned not null,
    title                varchar(75)         not null,
    work_email           varchar(255)        not null,
    work_phone           varchar(255)        not null,
    checked_authorize    tinyint(1) unsigned not null,
    twitter              varchar(20)         not null,
    twitter_verified     tinyint(1) unsigned not null,
    fb_verified          tinyint(1) unsigned not null,
    fb_name              varchar(75)         not null,
    fb_email             varchar(255)        not null,
    fb_count             mediumint unsigned  not null,
    best_time_to_contact text                not null,
    comments             text                not null,
    time_invited         datetime            null,
    time_signed_up       datetime            null,
    time_status_changed  datetime            null,
    primary key (publisher_account_id, user_id)
)
    collate = utf8_unicode_ci;

create index user_id
    on publisher_users (user_id, role, status);

create table publisher_users_invites
(
    invite_id            int unsigned auto_increment
        primary key,
    publisher_account_id int unsigned        not null,
    invited_email        varchar(255)        not null,
    inviter_user_id      int unsigned        not null,
    registered_user_id   int unsigned        not null,
    time_invited         datetime            null,
    status               tinyint(1) unsigned not null
)
    collate = utf8_unicode_ci;

create index invited_email
    on publisher_users_invites (invited_email);

create index publisher_account_id
    on publisher_users_invites (publisher_account_id, status);

create table push_tokens
(
    id                int unsigned auto_increment
        primary key,
    created_at        timestamp default CURRENT_TIMESTAMP           not null,
    updated_at        timestamp default CURRENT_TIMESTAMP           not null on update CURRENT_TIMESTAMP,
    user_id           int unsigned                                  not null,
    guid              bigint unsigned                               not null,
    device_identifier varchar(150)                                  not null,
    push_type         enum ('prod', 'alpha', 'proddev', 'alphadev') not null,
    platform          enum ('ios', 'android')                       not null,
    token             varchar(200)                                  not null,
    expires_at        timestamp                                     not null,
    constraint device_app_idx
        unique (device_identifier, push_type, platform),
    constraint user_device_app_idx
        unique (user_id, device_identifier, push_type, platform)
)
    collate = utf8mb4_bin;

create index expires_at_idx
    on push_tokens (expires_at);

create index user_idx
    on push_tokens (user_id);

create table `readitla_b.clearbit_data`
(
    id          int unsigned auto_increment
        primary key,
    clearbit_id varchar(255) not null,
    created_at  datetime     null,
    updated_at  datetime     null,
    data        blob         not null,
    domain_name varchar(255) not null
);

create table `readitla_b.domain_business_metadata`
(
    id                  int unsigned auto_increment
        primary key,
    created_at          datetime             null,
    updated_at          datetime             null,
    name                varchar(255)         null,
    legal_name          varchar(255)         null,
    logo_path           varchar(255)         null,
    greyscale_logo_path varchar(255)         null,
    pocket_override     tinyint(1) default 0 null,
    domain_name         varchar(255)         not null
);

create table setting
(
    setting_id          int unsigned auto_increment
        primary key,
    setting_category_id smallint unsigned           not null,
    setting_key         varchar(100)                not null,
    default_value       varchar(100)                null,
    active              tinyint(1)        default 0 not null,
    sort_order          smallint unsigned default 0 not null,
    constraint setting_key_idx
        unique (setting_key)
)
    collate = utf8_unicode_ci;

create index setting_category_idx
    on setting (setting_category_id, sort_order);

create table setting_category
(
    setting_category_id smallint unsigned not null
        primary key,
    name                varchar(100)      null
)
    collate = utf8_unicode_ci;

create table share_services
(
    share_service_id smallint(10) unsigned auto_increment
        primary key,
    name             varchar(50)           null,
    note             text charset latin1   not null,
    parent_id        smallint(10) unsigned not null
)
    charset = utf8;

create index name_idx
    on share_services (name);

create table share_spam_reports
(
    report_id           int auto_increment
        primary key,
    share_id            int unsigned not null,
    shared_by_user_id   int unsigned not null,
    recipient_friend_id int unsigned not null,
    time_reported       int          not null,
    constraint share_id
        unique (share_id, recipient_friend_id)
)
    charset = utf8;

create index friend_idx
    on share_spam_reports (recipient_friend_id);

create index share_idx
    on share_spam_reports (share_id);

create index time_reported
    on share_spam_reports (time_reported);

create index user_idx
    on share_spam_reports (shared_by_user_id, time_reported);

create table share_unviewed
(
    share_id int unsigned        not null,
    user_id  int unsigned        not null,
    unviewed tinyint(1) unsigned not null,
    primary key (share_id, user_id)
)
    collate = utf8_unicode_ci;

create index user_id
    on share_unviewed (user_id);

create table share_urls
(
    share_url_id   int unsigned auto_increment
        primary key,
    user_id        int unsigned                 not null,
    item_id        int unsigned                 not null,
    resolved_id    int unsigned                 not null,
    given_url      text collate utf8_unicode_ci not null,
    api_id         mediumint unsigned           not null,
    service_id     smallint(5)                  not null,
    time_generated int(10)                      not null,
    time_shared    int(10)                      not null
);

create table share_urls_items
(
    share_url_id int unsigned not null,
    item_id      int unsigned not null,
    primary key (share_url_id, item_id)
);

create index item_id
    on share_urls_items (item_id);

create table share_urls_log
(
    share_urls_log_id bigint unsigned auto_increment
        primary key,
    share_url_id      int unsigned                         not null,
    user_id           int unsigned                         not null,
    time_visited      int(10)                              not null,
    referrer          varchar(150) collate utf8_unicode_ci not null,
    user_agent        varchar(150) collate utf8_unicode_ci not null
);

create table shared_items
(
    share_id     int unsigned auto_increment
        primary key,
    user_id      int unsigned                        not null,
    item_id      int unsigned                        not null,
    share_url_id int unsigned                        not null,
    comment      text                                not null,
    quote        text                                not null,
    time_shared  int unsigned                        not null,
    time_updated int unsigned                        not null,
    api_id       mediumint unsigned                  not null,
    updated_at   timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index updated_at
    on shared_items (updated_at);

create index user_item
    on shared_items (user_id, item_id);

create table shares
(
    item_id      int unsigned                        not null,
    user_id      int unsigned                        not null,
    api_id       mediumint unsigned                  not null,
    service      varchar(30)                         not null,
    time_updated datetime                            not null,
    updated_at   timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    charset = utf8;

create index api_id
    on shares (api_id, item_id);

create index item_id
    on shares (item_id, user_id);

create index service
    on shares (service, item_id);

create index time_updated
    on shares (time_updated);

create index updated_at
    on shares (updated_at);

create index user_id
    on shares (user_id, item_id);

create table shares_friends
(
    user_id   int unsigned        not null,
    item_id   int unsigned        not null,
    share_id  int unsigned        not null,
    friend_id int unsigned        not null,
    unviewed  tinyint(1) unsigned not null,
    status    tinyint(1) unsigned not null,
    primary key (user_id, item_id, share_id)
)
    collate = utf8_unicode_ci;

create index friend_id
    on shares_friends (friend_id);

create index item_id
    on shares_friends (item_id);

create table shares_recipients
(
    share_id        int unsigned                        not null,
    friend_id       int unsigned                        not null,
    user_id         int unsigned                        not null,
    item_id         int unsigned                        not null,
    status          tinyint(1) unsigned                 not null,
    shared_to_email varchar(255)                        not null,
    updated_at      timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (share_id, friend_id)
)
    collate = utf8_unicode_ci;

create index friend_id
    on shares_recipients (friend_id);

create index idx_shared_to_email
    on shares_recipients (shared_to_email);

create index item_id
    on shares_recipients (item_id);

create index updated_at
    on shares_recipients (updated_at);

create index user_item
    on shares_recipients (user_id, item_id);

create table social_profile
(
    social_profile_id bigint auto_increment
        primary key,
    social_service_id smallint unsigned      not null,
    id                varchar(100)           null,
    name              varchar(100)           null,
    avatar_url        varchar(300)           null,
    description       text                   null,
    follow_count      int unsigned default 0 null,
    follower_count    int unsigned default 0 null,
    data              text                   null,
    user_id           int unsigned default 0 null,
    time_created      int unsigned default 0 null,
    time_updated      int unsigned default 0 null
)
    collate = utf8_unicode_ci;

create index social_service_id_idx
    on social_profile (social_service_id, id);

create index user_idx
    on social_profile (user_id, social_service_id);

create table social_services
(
    social_service_id smallint unsigned not null
        primary key,
    name              varchar(50)       not null
)
    collate = utf8_unicode_ci;

create index name_idx
    on social_services (name);

create table spam_user_ip
(
    id         int auto_increment
        primary key,
    ip         varchar(50) collate utf8_unicode_ci not null,
    time_added int                                 not null
)
    charset = utf8;

create index ip_idx
    on spam_user_ip (ip);

create table sphinx_vars
(
    var   varchar(20) not null
        primary key,
    value varchar(35) not null
)
    collate = utf8_unicode_ci;

create table spoc_campaigns
(
    id                int unsigned auto_increment
        primary key,
    user_id           int unsigned      default 0                 not null,
    type_id           smallint unsigned default 1                 not null,
    profile           text                                        not null,
    company           varchar(256)      default ''                not null,
    name              varchar(256)      default ''                not null,
    url               varchar(256)      default ''                not null,
    content_url       varchar(256)      default ''                not null,
    date_start        timestamp                                   not null,
    date_end          timestamp                                   not null,
    budget            varchar(256)      default ''                not null,
    targets           varchar(256)      default ''                not null,
    placements        varchar(256)      default ''                not null,
    creatives         text                                        not null,
    notes             varchar(256)      default ''                not null,
    status            smallint unsigned default 1                 not null,
    extra_info        text                                        not null,
    created_at        timestamp         default CURRENT_TIMESTAMP not null,
    updated_at        timestamp         default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    targeting_profile varchar(128)                                null
)
    collate = utf8_unicode_ci;

create index company_idx
    on spoc_campaigns (company(255));

create index content_url_idx
    on spoc_campaigns (content_url(255));

create index name_idx
    on spoc_campaigns (name(255));

create index profile_idx
    on spoc_campaigns (profile(255));

create index type_idx
    on spoc_campaigns (type_id);

create table spoc_ff_creatives
(
    source_id   int unsigned                           not null,
    campaign_id int unsigned                           not null,
    title       varchar(255)                           not null,
    url         text                                   not null,
    content_url text                                   not null,
    item_id     int unsigned default 0                 not null,
    tile_id     int unsigned                           not null,
    created_at  datetime     default CURRENT_TIMESTAMP null,
    constraint source_campaign_idx
        unique (source_id, campaign_id)
)
    collate = utf8_unicode_ci;

create index campaign_idx
    on spoc_ff_creatives (campaign_id);

create index tile_idx
    on spoc_ff_creatives (tile_id);

create table spoc_tile_activity
(
    tile_id               int unsigned           not null
        primary key,
    created_at            datetime               not null,
    clicks                int unsigned default 0 not null,
    impressions           int unsigned default 0 not null,
    clicks_last_hour      int unsigned default 0 not null,
    impressions_last_hour int unsigned default 0 not null
);

create table spoc_tile_activity_raw
(
    tile_id     int unsigned           not null,
    created_at  datetime               not null,
    clicks      int unsigned default 0 not null,
    impressions int unsigned default 0 not null
);

create index created_at_idx
    on spoc_tile_activity_raw (created_at);

create index tile_idx
    on spoc_tile_activity_raw (tile_id);

create table stripe_historical_log
(
    stripe_event_id varchar(255) collate utf8_bin not null
        primary key,
    time_added      int unsigned                  not null,
    livemode        tinyint unsigned default 0    null,
    processed       tinyint unsigned default 0    null
)
    collate = utf8_unicode_ci;

create index processed_idx
    on stripe_historical_log (livemode, processed);

create table stripe_transaction_log
(
    log_id              bigint unsigned auto_increment
        primary key,
    stripe_webhook_id   varchar(255) collate utf8_bin not null,
    stripe_webhook_type varchar(40)                   not null,
    object              text                          not null,
    time_added          int unsigned                  not null,
    livemode            tinyint unsigned default 0    null
)
    collate = utf8_unicode_ci;

create index webhook_idx
    on stripe_transaction_log (stripe_webhook_id);

create table subscription_source
(
    id   tinyint unsigned not null
        primary key,
    name varchar(30)      not null
)
    collate = utf8_unicode_ci;

create table subscription_type
(
    id   tinyint unsigned not null
        primary key,
    name varchar(30)      not null
)
    collate = utf8_unicode_ci;

create table subscriptions
(
    subscription_id     int unsigned auto_increment
        primary key,
    subscription_source tinyint unsigned              not null,
    subscription_type   tinyint unsigned              not null,
    name                varchar(50)                   not null,
    source_id           varchar(255) collate utf8_bin not null,
    amount              int unsigned      default 0   null,
    display_amount      varchar(30)                   null,
    fee                 int unsigned      default 0   null,
    currency            varchar(10)                   not null,
    trial_period_days   smallint unsigned default 0   null,
    status              tinyint unsigned  default 0   null,
    livemode            tinyint unsigned  default 0   null,
    version_key         varchar(30)                   null,
    usd_amount          int unsigned                  null
)
    collate = utf8_unicode_ci;

create index source_currency_idx
    on subscriptions (subscription_source, source_id, currency, status, livemode);

create index source_id_idx
    on subscriptions (subscription_source, source_id, status, livemode);

create index source_idx
    on subscriptions (subscription_source, status, livemode);

create index type_idx
    on subscriptions (subscription_type, status, livemode);

create table suggested_tags_locale_grouping_tags
(
    language       varchar(10)             not null,
    grouping_id    bigint unsigned         not null,
    tag            varchar(25)             not null,
    weighted_count decimal(11, 4) unsigned not null,
    count          int unsigned            not null,
    user_count     int unsigned            not null,
    primary key (language, grouping_id, tag)
)
    collate = utf8_unicode_ci;

create table suggested_tags_locale_groupings
(
    language       varchar(10)             not null,
    grouping_id    bigint unsigned         not null,
    weighted_count decimal(11, 4) unsigned not null,
    count          int unsigned            not null,
    user_count     int unsigned            not null,
    primary key (language, grouping_id)
)
    collate = utf8_unicode_ci;

create table suggested_tags_locale_tag_user_cnt
(
    language varchar(10)  not null,
    tag      varchar(25)  not null,
    count    int unsigned not null,
    primary key (language, tag)
)
    collate = utf8_unicode_ci;

create table suggested_tags_user_grouping_tags
(
    user_id        int unsigned            not null,
    grouping_id    bigint unsigned         not null,
    tag            varchar(25)             not null,
    weighted_count decimal(11, 4) unsigned not null,
    count          int unsigned            not null,
    primary key (user_id, grouping_id, tag)
)
    collate = utf8_unicode_ci;

create index user_tag_idx
    on suggested_tags_user_grouping_tags (user_id, tag);

create table suggested_tags_user_groupings
(
    user_id        int unsigned            not null,
    grouping_id    bigint unsigned         not null,
    weighted_count decimal(11, 4) unsigned not null,
    count          int unsigned            not null,
    primary key (user_id, grouping_id)
)
    collate = utf8_unicode_ci;

create table suggested_tags_user_language
(
    user_id   int unsigned                        not null
        primary key,
    language  varchar(10) collate utf8_unicode_ci not null,
    max_birth datetime                            not null
)
    charset = utf8;

create index user_birth_idx
    on suggested_tags_user_language (user_id, language, max_birth);

create table suggested_users_curated
(
    user_id int unsigned not null
        primary key,
    weight  int unsigned not null
)
    charset = utf8;

create table suggested_users_influencers
(
    user_id int unsigned not null
        primary key,
    weight  int unsigned not null
)
    charset = utf8;

create table suggested_users_lists
(
    list_id int auto_increment
        primary key,
    slug    varchar(30) collate utf8_unicode_ci not null,
    name    varchar(30) collate utf8_unicode_ci not null
)
    charset = utf8;

create index slug
    on suggested_users_lists (slug);

create table suggested_users_user_lists
(
    list_id int auto_increment,
    user_id int not null,
    primary key (list_id, user_id)
)
    charset = utf8;

create index user_id
    on suggested_users_user_lists (user_id);

create table suggested_users_user_post_frequency
(
    user_id         int unsigned           not null
        primary key,
    recent_post_cnt int unsigned default 0 null,
    time_updated    int unsigned default 0 null
)
    collate = utf8_unicode_ci;

create table suggested_users_user_topic_weights
(
    user_id      int unsigned           not null,
    grouping_id  bigint unsigned        not null,
    total_weight decimal(5, 4) unsigned not null,
    max_weight   decimal(5, 4) unsigned not null,
    time_updated int unsigned           not null,
    primary key (grouping_id, user_id)
)
    charset = utf8;

create table survey_responses
(
    id               bigint(10) unsigned auto_increment
        primary key,
    survey_id        int unsigned                                  not null,
    group_id         int unsigned                                  not null,
    user_key         bigint unsigned                               not null,
    user_key_type_id tinyint(4) unsigned default 0                 null,
    status           tinyint unsigned    default 1                 not null,
    response         text                                          not null,
    responded_at     timestamp           default CURRENT_TIMESTAMP not null
)
    charset = utf8;

create index surveys_idx
    on survey_responses (survey_id, group_id, user_key);

create table syndicated_article_author
(
    id         int unsigned auto_increment
        primary key,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null,
    name       varchar(100) collate utf8mb4_bin    not null,
    url        text collate utf8mb4_bin            null,
    author_id  int unsigned                        null,
    constraint original_author_unique
        unique (author_id)
)
    collate = utf8_unicode_ci;

create table syndicated_article_content
(
    id                    int unsigned auto_increment
        primary key,
    syndicated_article_id int unsigned                        not null,
    content               mediumtext                          not null,
    created_at            timestamp default CURRENT_TIMESTAMP not null,
    updated_at            timestamp default CURRENT_TIMESTAMP not null,
    parsed_at             timestamp default CURRENT_TIMESTAMP not null,
    constraint syndicated_article_id_unique
        unique (syndicated_article_id)
)
    collate = utf8_unicode_ci;

create table syndicated_article_contents
(
    id         int unsigned auto_increment
        primary key,
    content    mediumtext collate utf8mb4_bin      not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null,
    parsed_at  timestamp default CURRENT_TIMESTAMP not null
)
    collate = utf8_unicode_ci;

create table syndicated_article_images
(
    id                    int unsigned auto_increment
        primary key,
    syndicated_article_id int unsigned not null,
    syndicated_image_id   int unsigned not null,
    constraint article_image_idx
        unique (syndicated_article_id, syndicated_image_id)
)
    collate = utf8_unicode_ci;

create table syndicated_article_metadata
(
    id                    int unsigned auto_increment
        primary key,
    syndicated_article_id int unsigned                        not null,
    created_at            timestamp default CURRENT_TIMESTAMP not null,
    updated_at            timestamp default CURRENT_TIMESTAMP not null,
    date_published        timestamp                           null,
    locale_language       varchar(3)                          null,
    locale_country        int(4)                              null,
    title                 text collate utf8mb4_bin            null,
    excerpt               text collate utf8mb4_bin            null,
    domain_id             int unsigned                        not null,
    publisher_id          int unsigned                        null,
    constraint syndicated_article_id_unique
        unique (syndicated_article_id)
)
    collate = utf8_unicode_ci;

create table syndicated_article_metadata_syndicated_article_author
(
    syndicated_article_metadata_id int unsigned not null,
    syndicated_article_author_id   int unsigned not null,
    primary key (syndicated_article_author_id, syndicated_article_metadata_id)
)
    collate = utf8_unicode_ci;

create table syndicated_article_publisher
(
    id                                 int unsigned auto_increment
        primary key,
    created_at                         timestamp                               default CURRENT_TIMESTAMP not null,
    updated_at                         timestamp                               default CURRENT_TIMESTAMP not null,
    name                               varchar(255) collate utf8mb4_unicode_ci                           not null,
    recommendation_name                varchar(255) collate utf8mb4_unicode_ci default ''                not null,
    logo_url                           text collate utf8mb4_unicode_ci                                   not null,
    logo_name                          varchar(255) collate utf8mb4_unicode_ci                           not null,
    url                                text collate utf8mb4_unicode_ci                                   not null,
    no_author                          tinyint(1) unsigned                     default 0                 null,
    use_domain_on_related_items_header tinyint(1) unsigned                     default 0                 null,
    custom_button                      tinyint(1) unsigned                     default 0                 null,
    custom_button_text                 varchar(255) collate utf8mb4_unicode_ci                           null,
    custom_button_leadin               varchar(255) collate utf8mb4_unicode_ci                           null,
    custom_button_url                  text collate utf8mb4_unicode_ci                                   null,
    appeared_on_domain                 tinyint(1) unsigned                     default 0                 null,
    logo_wide_url                      text collate utf8mb4_unicode_ci                                   null,
    logo_wide_name                     varchar(255) collate utf8mb4_unicode_ci                           null,
    logo_wide_bw_url                   text collate utf8mb4_unicode_ci                                   null,
    logo_wide_bw_name                  varchar(255) collate utf8mb4_unicode_ci                           null,
    attribute_canonical_to_publisher   tinyint(1) unsigned                     default 0                 null
)
    charset = utf8;

create table syndicated_article_publisher_domains
(
    syndicated_article_publisher_id int unsigned not null,
    domain_id                       int unsigned not null,
    primary key (syndicated_article_publisher_id, domain_id)
)
    charset = utf8;

create table syndicated_article_routed_items
(
    original_resolved_id  int unsigned default 0                 not null,
    syndicated_article_id int unsigned                           not null,
    updated_at            timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (original_resolved_id, syndicated_article_id)
)
    collate = utf8_unicode_ci;

create index idx_use_article_id
    on syndicated_article_routed_items (syndicated_article_id);

create index updated_at
    on syndicated_article_routed_items (updated_at);

create table syndicated_article_slugs
(
    id                       int unsigned auto_increment
        primary key,
    syndicated_article_id    int unsigned                                  not null,
    slug                     varchar(150) collate utf8mb4_unicode_ci       not null,
    slug_hash                varchar(32)                                   not null,
    primary_slug             tinyint(1) unsigned default 1                 null,
    created_at               timestamp           default CURRENT_TIMESTAMP not null,
    updated_at               timestamp           default CURRENT_TIMESTAMP not null,
    original_resolved_id     int unsigned                                  not null,
    syndicated_article_id_v2 int unsigned                                  not null,
    constraint slug_unique_idx
        unique (slug_hash)
)
    charset = utf8;

create index slug_idx
    on syndicated_article_slugs (slug);

create index syndicated_article_id_v2_idx
    on syndicated_article_slugs (syndicated_article_id_v2);

create index syndicated_article_idx
    on syndicated_article_slugs (syndicated_article_id);

create table syndicated_article_syndicated_image
(
    syndicated_article_id int unsigned not null,
    syndicated_image_id   int unsigned not null,
    primary key (syndicated_article_id, syndicated_image_id)
)
    collate = utf8_unicode_ci;

create table syndicated_articles
(
    resolved_id                   int unsigned        default 0                 not null,
    original_resolved_id          int unsigned        default 0                 not null,
    author_user_id                int unsigned                                  not null,
    date_published                datetime                                      null,
    status                        tinyint unsigned                              not null,
    hide_images                   tinyint(1) unsigned                           null,
    force_domain_id               int                                           null,
    syndicated_resolved_id        int unsigned                                  null,
    show_ads                      tinyint(1) unsigned default 1                 null,
    publisher_url                 mediumtext                                    not null,
    author_names                  mediumtext                                    null,
    expires_at                    datetime                                      null,
    id                            int unsigned auto_increment
        primary key,
    created_at                    timestamp           default CURRENT_TIMESTAMP not null,
    updated_at                    timestamp           default CURRENT_TIMESTAMP not null,
    published_at                  timestamp                                     null,
    locale_language               varchar(3)                                    null,
    locale_country                int(4)                                        null,
    title                         text collate utf8mb4_bin                      null,
    excerpt                       text collate utf8mb4_bin                      null,
    domain_id                     int unsigned                                  not null,
    publisher_id                  int unsigned                                  not null,
    syndicated_article_content_id int(10)                                       null,
    slug                          varchar(150)                                  null,
    main_image                    text                                          null,
    iab_top_category              varchar(255) collate utf8mb4_bin              null,
    iab_sub_category              varchar(255) collate utf8mb4_bin              null,
    curation_category             varchar(255) collate utf8mb4_bin              null
)
    collate = utf8_unicode_ci;

create index idx_author_user_id
    on syndicated_articles (author_user_id);

create index idx_original_resolved_id
    on syndicated_articles (original_resolved_id);

create index slug_idx
    on syndicated_articles (slug);

create table syndicated_articles_router
(
    resolved_id     int unsigned default 0                 not null,
    use_resolved_id int unsigned                           not null,
    updated_at      timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (resolved_id, use_resolved_id)
)
    collate = utf8_unicode_ci;

create index idx_use_resolved_id
    on syndicated_articles_router (use_resolved_id);

create index updated_at
    on syndicated_articles_router (updated_at);

create table syndicated_articles_slug_router
(
    id                    int unsigned auto_increment
        primary key,
    syndicated_article_id int unsigned                                  not null,
    slug                  varchar(150)                                  null,
    primary_slug          tinyint(1) unsigned default 1                 null,
    created_at            timestamp           default CURRENT_TIMESTAMP not null,
    updated_at            timestamp           default CURRENT_TIMESTAMP not null,
    slug_hash             varchar(32)                                   not null,
    constraint slug_unique_idx
        unique (slug_hash)
)
    charset = utf8;

create index slug_idx
    on syndicated_articles_slug_router (slug);

create index syndicated_article_idx
    on syndicated_articles_slug_router (syndicated_article_id);

create table syndicated_image
(
    id           int unsigned auto_increment
        primary key,
    updated_at   timestamp default CURRENT_TIMESTAMP not null,
    created_at   timestamp default CURRENT_TIMESTAMP not null,
    image_name   varchar(255)                        not null,
    image_url    text                                not null,
    hash_name    varchar(32)                         not null,
    image_size   int                                 null,
    image_width  int                                 null,
    image_height int                                 null,
    constraint image_name
        unique (hash_name)
)
    collate = utf8mb4_unicode_ci;

create table tile_source
(
    tile_id    int unsigned auto_increment
        primary key,
    source_id  int unsigned                                     default 0                 not null,
    type       enum ('curated', 'spoc') collate utf8_unicode_ci default 'curated'         null,
    created_at timestamp                                        default CURRENT_TIMESTAMP not null,
    updated_at timestamp                                        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint resolved_idx
        unique (type, source_id)
)
    charset = utf8;

create table top_content_2013
(
    cat_type_id   smallint unsigned default 0          not null comment '1: best; 2: grouping; 3: domain',
    cat_name      varchar(75) collate utf8_unicode_ci  null,
    cat_slug      varchar(75)                          null,
    source_id     bigint unsigned   default 0          not null comment 'cat1: 0; cat2: grouping_id; cat3: domain_id',
    resolved_id   int unsigned                         not null,
    title         text collate utf8_unicode_ci         null,
    author        varchar(100) collate utf8_unicode_ci null,
    author_id     int unsigned                         null,
    author_ind    tinyint(1)                           null,
    domain        varchar(75) collate utf8_unicode_ci  null,
    domain_id     int unsigned                         not null,
    image_src     text                                 null,
    image_width   smallint unsigned                    null,
    image_height  smallint unsigned                    null,
    url           text collate utf8_unicode_ci         not null,
    shortened_url text collate utf8_unicode_ci         null,
    `rank`        int unsigned                         null,
    rank_old      int unsigned                         null,
    impact_score  decimal(7, 4)                        null,
    save_cnt      int(10)                              null,
    relevance     decimal(5, 4)                        null,
    review_ind    tinyint(1)                           null,
    primary key (cat_type_id, source_id, resolved_id)
)
    charset = utf8;

create index cat_slug_idx
    on top_content_2013 (cat_type_id, cat_slug);

create index rank_idx
    on top_content_2013 (`rank`);

create index rank_old_idx
    on top_content_2013 (rank_old);

create index resolved_idx
    on top_content_2013 (resolved_id);

create table top_content_2013_domain_lookup
(
    domain varchar(75) collate utf8_unicode_ci null,
    slug   varchar(75) collate utf8_unicode_ci null
);

create index slug_idx
    on top_content_2013_domain_lookup (slug);

create table top_publishers_2013
(
    domain_id    int unsigned default 0              not null
        primary key,
    publisher_id int unsigned                        null,
    name         varchar(75) collate utf8_unicode_ci null,
    domain       varchar(75) collate utf8_unicode_ci null,
    value        int unsigned                        null comment 'type = 1: save_cnt; type = 2: sort',
    type         tinyint(1) unsigned                 null comment '1: top; 2: breakout'
)
    charset = utf8;

create index type_idx
    on top_publishers_2013 (type);

create index value_idx
    on top_publishers_2013 (value);

create table track_app_links_log
(
    to_slug      varchar(25)        null,
    to_api_id    mediumint unsigned null,
    user_id      int unsigned       null,
    from_api_id  mediumint unsigned null,
    time_entered datetime           null,
    source       varchar(30)        null,
    camp_id      smallint unsigned  null,
    version      tinyint unsigned   null
)
    collate = utf8_unicode_ci;

create index from_api_id
    on track_app_links_log (from_api_id);

create index source_trk
    on track_app_links_log (source, camp_id, version);

create index to_api_id
    on track_app_links_log (to_api_id);

create index to_slug
    on track_app_links_log (to_slug);

create index user_id
    on track_app_links_log (user_id);

create table track_camps
(
    camp_id smallint unsigned auto_increment
        primary key,
    name    text not null
);

create table track_errors
(
    api_id        mediumint unsigned not null,
    user_id       int unsigned       not null,
    time_happened datetime           not null,
    log           text               not null
)
    charset = utf8;

create index api_id
    on track_errors (user_id, api_id);

create index time_happened
    on track_errors (time_happened);

create table track_log
(
    camp_id      smallint unsigned  not null,
    model_id     tinyint unsigned   not null,
    version      tinyint unsigned   not null,
    api_id       mediumint unsigned not null,
    stage        tinyint unsigned   not null,
    user_id      int unsigned       not null,
    time_entered datetime           not null
);

create index camp_id
    on track_log (camp_id, model_id, version, api_id, stage);

create index user_id
    on track_log (user_id);

create table track_models
(
    camp_id  smallint unsigned not null,
    model_id tinyint unsigned,
    name     text              not null,
    primary key (camp_id, model_id)
);

create index model_id
    on track_models (model_id);

alter table track_models
    modify model_id tinyint unsigned auto_increment;

create table track_values_log
(
    value_id     smallint unsigned                    not null,
    value        varchar(255) collate utf8_unicode_ci not null,
    api_id       mediumint unsigned                   not null,
    user_id      int unsigned                         not null,
    time_entered datetime                             not null,
    primary key (value_id, user_id, value(15), time_entered)
);

create index api_id
    on track_values_log (api_id);

create index time_entered
    on track_values_log (time_entered);

create index user_id
    on track_values_log (user_id);

create index value
    on track_values_log (value(30));

create table trending_domain_whitelist
(
    id           int unsigned auto_increment
        primary key,
    domain_id    int unsigned default 0 not null,
    time_updated int unsigned default 0 null,
    constraint domain_idx
        unique (domain_id)
)
    collate = utf8_unicode_ci;

create table trending_topics
(
    trending_topic_id int unsigned auto_increment
        primary key,
    display_name      varchar(100) collate utf8_unicode_ci not null,
    slug              varchar(150) collate utf8_unicode_ci not null,
    status            tinyint(1) unsigned default 0        not null,
    weight            int unsigned        default 1        not null,
    time_added        int unsigned                         not null,
    time_updated      int unsigned                         not null,
    time_expired      int unsigned                         not null,
    category_id       int unsigned                         not null,
    data_source_id    int unsigned                         not null,
    data_query        text collate utf8_unicode_ci         not null,
    constraint slug_idx
        unique (slug)
)
    charset = utf8;

create index name_idx
    on trending_topics (display_name);

create index sort_idx
    on trending_topics (time_expired, status, weight, time_updated);

create table trending_topics_categories
(
    category_id int unsigned auto_increment
        primary key,
    name        varchar(100) collate utf8_unicode_ci not null
)
    charset = utf8;

create table trending_topics_data_sources
(
    data_source_id int unsigned auto_increment
        primary key,
    name           varchar(100) collate utf8_unicode_ci not null,
    source         text collate utf8_unicode_ci         not null
)
    charset = utf8;

create table trending_topics_prospect_research
(
    prospect_research_id int unsigned auto_increment
        primary key,
    prospect_id          int unsigned                 not null,
    reserach_type_id     int unsigned                 not null,
    query                text collate utf8_unicode_ci not null
)
    charset = utf8;

create index prospect_idx
    on trending_topics_prospect_research (prospect_id);

create table trending_topics_prospects
(
    prospect_id int unsigned auto_increment
        primary key,
    name        varchar(100) collate utf8_unicode_ci not null,
    time_added  int unsigned                         not null,
    constraint time_name_idx
        unique (time_added, name)
)
    charset = utf8;

create table trending_topics_research
(
    research_id       int unsigned auto_increment
        primary key,
    trending_topic_id int unsigned                 not null,
    reserach_type_id  int unsigned                 not null,
    query             text collate utf8_unicode_ci not null
)
    charset = utf8;

create index trending_topic_idx
    on trending_topics_research (trending_topic_id);

create table trending_topics_research_types
(
    research_type_id int unsigned auto_increment
        primary key,
    name             varchar(100) collate utf8_unicode_ci not null,
    source           text collate utf8_unicode_ci         not null
)
    charset = utf8;

create table trending_topics_twitter
(
    time_added      int unsigned              not null,
    woeid           bigint unsigned default 0 not null,
    `rank`          int unsigned    default 0 not null,
    name            varchar(100)              not null,
    query           varchar(100)              not null,
    top_resolved_id int unsigned              null,
    primary key (time_added, woeid, `rank`, name)
)
    collate = utf8_unicode_ci;

create table twitter_users
(
    id                bigint unsigned                     not null
        primary key,
    name              varchar(255)                        null,
    screen_name       varchar(255)                        null,
    profile_image_url varchar(255)                        null,
    followers_count   int                                 null,
    friends_count     int                                 null,
    location          varchar(255)                        null,
    url               varchar(255)                        null,
    time_created      int unsigned                        null,
    time_updated      int unsigned                        null,
    updated_at        timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    charset = utf8;

create index updated_at
    on twitter_users (updated_at);

create table unite_domains_whitelist
(
    domain_id int unsigned                        not null
        primary key,
    domain    varchar(75) collate utf8_unicode_ci not null,
    constraint domain
        unique (domain)
)
    charset = utf8;

create table user_action_dupes
(
    user_action_id bigint auto_increment
        primary key,
    user_id        int unsigned                 not null,
    session_id     int unsigned       default 0 null,
    item_id        int unsigned       default 0 null,
    api_id         mediumint unsigned default 0 null,
    app_name       varchar(20)                  null,
    app_version    varchar(20)                  null,
    os_type        varchar(20)                  null,
    os_version     varchar(20)                  null,
    device_mfg     varchar(20)                  null,
    device_name    varchar(20)                  null,
    device_type    varchar(20)                  null,
    store_name     varchar(20)                  null,
    action_type_id smallint unsigned            not null,
    time_updated   datetime                     not null
)
    collate = utf8_unicode_ci;

create index action_type_id
    on user_action_dupes (action_type_id);

create table user_action_ifttt
(
    user_action_id bigint                      not null
        primary key,
    user_id        int unsigned                not null,
    item_id        int unsigned      default 0 null,
    api_id         smallint unsigned default 0 null,
    time_updated   datetime                    not null,
    channel        varchar(50)                 null
)
    collate = utf8_unicode_ci;

create index channel_idx
    on user_action_ifttt (channel);

create table user_annotations
(
    annotation_id varchar(50)                                not null
        primary key,
    user_id       int unsigned                               not null,
    item_id       int unsigned                               not null,
    quote         mediumtext                                 null,
    patch         mediumtext                                 null,
    version       int(10)          default 1                 not null,
    status        tinyint unsigned default 1                 not null,
    created_at    timestamp        default CURRENT_TIMESTAMP not null,
    updated_at    timestamp        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8mb4_bin;

create index item_idx
    on user_annotations (item_id, version);

create index user_item_idx
    on user_annotations (user_id, item_id);

create table user_aol_account
(
    user_id   int unsigned                         not null
        primary key,
    aol_email varchar(150) collate utf8_unicode_ci not null,
    api_id    mediumint unsigned                   not null
)
    charset = utf8;

create index aol_email_idx
    on user_aol_account (aol_email);

create table user_ctas
(
    user_id     int unsigned           not null,
    cta_id      mediumint unsigned     not null,
    api_id      mediumint unsigned     not null,
    last_viewed int unsigned default 0 null,
    last_acted  int unsigned default 0 null,
    primary key (user_id, cta_id, api_id)
)
    collate = utf8_unicode_ci;

create index cta_id
    on user_ctas (cta_id);

create table user_firefox_account
(
    user_id              int unsigned                         not null
        primary key,
    firefox_access_token varchar(100)                         not null,
    firefox_uid          varchar(40)                          not null,
    firefox_email        varchar(150) collate utf8_unicode_ci not null,
    firefox_avatar       varchar(255) collate utf8_unicode_ci not null,
    birth                datetime                             not null,
    api_id               mediumint unsigned                   not null,
    last_auth_date       datetime                             null,
    deauth_date          datetime                             null,
    active               tinyint   default 0                  null,
    updated_at           timestamp default CURRENT_TIMESTAMP  not null on update CURRENT_TIMESTAMP
)
    charset = utf8;

create index firefox_access_token
    on user_firefox_account (firefox_access_token);

create index firefox_uid
    on user_firefox_account (firefox_uid);

create index updated_at
    on user_firefox_account (updated_at);

create table user_follows
(
    user_id        int unsigned                           not null,
    follow_user_id int unsigned                           not null,
    time_updated   int unsigned default 0                 null,
    updated_at     timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, follow_user_id)
)
    collate = utf8_unicode_ci;

create index follower_idx
    on user_follows (follow_user_id);

create index updated_at
    on user_follows (updated_at);

create table user_friends
(
    user_id        int unsigned not null,
    friend_id      int unsigned not null,
    friend_user_id int unsigned not null,
    primary key (user_id, friend_id)
)
    collate = utf8_unicode_ci;

create index friend_id
    on user_friends (friend_user_id);

create table user_ghost_account
(
    user_id       int unsigned not null,
    ghost_user_id int unsigned not null,
    time_created  int          not null,
    primary key (user_id, ghost_user_id)
)
    charset = utf8;

create index ghost_user_idx
    on user_ghost_account (ghost_user_id);

create table user_google_account
(
    user_id        int unsigned                         not null
        primary key,
    google_id      varchar(40)                          not null,
    google_email   varchar(150) collate utf8_unicode_ci not null,
    access_token   varchar(255)                         null,
    birth          datetime                             not null,
    api_id         mediumint unsigned                   not null,
    last_auth_date datetime                             null,
    deauth_date    datetime                             null,
    active         tinyint   default 0                  null,
    updated_at     timestamp default CURRENT_TIMESTAMP  not null on update CURRENT_TIMESTAMP
)
    charset = utf8;

create index google_id
    on user_google_account (google_id);

create index updated_at
    on user_google_account (updated_at);

create table user_google_lookup
(
    user_id   int unsigned not null
        primary key,
    google_id varchar(40)  not null,
    birth     datetime     not null,
    constraint google_id
        unique (google_id)
)
    charset = utf8;

create table user_highlights_process_schedule
(
    user_id   int unsigned                  not null
        primary key,
    monday    tinyint(1) unsigned default 0 not null,
    tuesday   tinyint(1) unsigned default 0 not null,
    wednesday tinyint(1) unsigned default 0 not null,
    thursday  tinyint(1) unsigned default 0 not null,
    friday    tinyint(1) unsigned default 0 not null,
    saturday  tinyint(1) unsigned default 0 not null,
    sunday    tinyint(1) unsigned default 0 not null
)
    charset = utf8;

create index friday_idx
    on user_highlights_process_schedule (friday);

create index monday_idx
    on user_highlights_process_schedule (monday);

create index saturday_idx
    on user_highlights_process_schedule (saturday);

create index sunday_idx
    on user_highlights_process_schedule (sunday);

create index thursday_idx
    on user_highlights_process_schedule (thursday);

create index tuesday_idx
    on user_highlights_process_schedule (tuesday);

create index wednesday_idx
    on user_highlights_process_schedule (wednesday);

create table user_ip
(
    id           int auto_increment
        primary key,
    user_id      int unsigned                        not null,
    event_type   varchar(30) collate utf8_unicode_ci not null,
    ip           varchar(50) collate utf8_unicode_ci not null,
    api_id       mediumint unsigned                  not null,
    time_added   int                                 not null,
    days_since   smallint default 0                  null,
    threat_score smallint default 0                  null,
    visitor_type smallint default 0                  null,
    constraint user_idx
        unique (user_id, event_type)
)
    charset = utf8;

create index ip_idx
    on user_ip (ip);

create index time_added_idx
    on user_ip (time_added);

create table user_item_backfill_queue
(
    id       mediumint unsigned auto_increment,
    user_id  int unsigned      not null
        primary key,
    priority smallint unsigned not null,
    constraint idx
        unique (id)
)
    charset = utf8;

create table user_key_type
(
    id   tinyint     not null
        primary key,
    name varchar(30) null
);

create table user_library_backfill_status
(
    user_id               int unsigned               not null
        primary key,
    backfill_complete     tinyint unsigned default 0 null,
    backfill_percent      tinyint unsigned default 0 null,
    time_backfill_started datetime                   null,
    time_updated          datetime                   null
)
    collate = utf8_unicode_ci;

create index backfill_idx
    on user_library_backfill_status (backfill_complete);

create table user_list_size
(
    user_id   int unsigned not null
        primary key,
    list_size int          null
)
    collate = utf8_unicode_ci;

create table user_locale
(
    user_id    int unsigned                        not null,
    api_id     mediumint unsigned                  not null,
    locale     varchar(5) collate utf8_unicode_ci  not null,
    country    varchar(5) collate utf8_unicode_ci  not null,
    language   varchar(10) collate utf8_unicode_ci not null,
    birth      datetime                            not null,
    birth_type tinyint   default 0                 null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, api_id)
)
    charset = utf8;

create index country_idx
    on user_locale (country, birth_type);

create index locale_idx
    on user_locale (locale, birth_type);

create index updated_at
    on user_locale (updated_at);

create table user_merges
(
    source_user_id                         int unsigned                not null,
    destination_user_id                    int unsigned                not null,
    destination_original_item_count        int unsigned                not null,
    destination_original_grouping_count    int unsigned                not null,
    destination_original_tag_count         int unsigned                not null,
    destination_original_attribution_count int unsigned      default 0 not null,
    disable_source_user                    smallint unsigned           not null,
    transfer_premium                       smallint unsigned default 0 not null,
    date                                   datetime                    not null,
    item_ids                               longtext                    not null,
    item_count                             int unsigned                not null,
    items_copied                           int unsigned                not null,
    grouping_ids                           longtext                    not null,
    grouping_count                         int unsigned                not null,
    groupings_copied                       int unsigned                not null,
    tag_ids                                longtext                    not null,
    tag_count                              int unsigned                not null,
    tags_copied                            int unsigned                not null,
    attribution_ids                        longtext                    null,
    attribution_count                      int unsigned      default 0 null,
    attributions_copied                    int unsigned      default 0 null,
    constraint source_user_id
        unique (source_user_id, destination_user_id)
)
    charset = utf8;

create table user_message_action
(
    user_message_action_id bigint unsigned auto_increment
        primary key,
    user_id                int unsigned                 not null,
    session_id             int unsigned       default 0 null,
    item_id                int unsigned       default 0 null,
    api_id                 mediumint unsigned default 0 null,
    app_name               varchar(20)                  null,
    app_version            varchar(20)                  null,
    os_type                varchar(20)                  null,
    os_version             varchar(20)                  null,
    device_mfg             varchar(20)                  null,
    device_name            varchar(20)                  null,
    device_type            varchar(20)                  null,
    store_name             varchar(20)                  null,
    action_type_id         smallint unsigned            not null,
    message_id             int unsigned                 not null,
    template_id            int unsigned       default 0 null,
    link_id                int unsigned       default 0 null,
    time_updated           int(11) unsigned             not null
)
    collate = utf8_unicode_ci;

create index action_type_idx
    on user_message_action (action_type_id);

create index message_idx
    on user_message_action (message_id, template_id, link_id);

create index template_idx
    on user_message_action (template_id);

create index time_updated_idx
    on user_message_action (time_updated);

create table user_notifications
(
    user_notification_id      bigint unsigned auto_increment
        primary key,
    user_id                   int unsigned                               not null,
    notification_template_id  int unsigned                               not null,
    notification_campaign_key varchar(50) collate utf8mb4_bin            null,
    post_id                   int unsigned                               null,
    share_id                  int unsigned                               null,
    item_id                   int unsigned                               null,
    action_user_id            int unsigned                               not null,
    action_type_id            smallint unsigned                          null,
    status                    tinyint unsigned default 0                 null,
    time_added                int unsigned                               not null,
    time_updated              int unsigned                               not null,
    notification_hash         char(64)                                   not null,
    updated_at                timestamp        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint hash_idx
        unique (notification_hash)
)
    collate = utf8_unicode_ci;

create index action_user_idx
    on user_notifications (action_user_id);

create index item_status_idx
    on user_notifications (item_id, status);

create index notification_campaign_idx
    on user_notifications (notification_campaign_key);

create index post_status_idx
    on user_notifications (post_id, status);

create index share_status_idx
    on user_notifications (share_id, status);

create index updated_at
    on user_notifications (updated_at);

create index user_action_type_idx
    on user_notifications (user_id, action_type_id, action_user_id);

create index user_item_idx
    on user_notifications (user_id, item_id);

create index user_status_idx
    on user_notifications (user_id, status);

create table user_precache
(
    precache_id  bigint auto_increment
        primary key,
    user_id      int unsigned      not null,
    processed    tinyint default 0 null,
    time_updated datetime          not null,
    constraint user_id
        unique (user_id)
)
    collate = utf8_unicode_ci;

create table user_premium_cleanup
(
    user_id                  int unsigned           not null
        primary key,
    time_added               int unsigned default 0 null,
    time_search_removed      int unsigned default 0 null,
    time_permlibrary_removed int unsigned default 0 null
)
    collate = utf8_unicode_ci;

create table user_premium_status
(
    user_id              int unsigned not null
        primary key,
    time_premium_stopped int unsigned null
)
    collate = utf8_unicode_ci;

create table user_profile
(
    user_id        int unsigned                           not null
        primary key,
    username       varchar(20)                            null,
    name           varchar(100)                           null,
    description    mediumtext                             null,
    avatar_url     varchar(300)                           null,
    follower_count int unsigned default 0                 null,
    follow_count   int unsigned default 0                 null,
    post_count     int unsigned default 0                 null,
    data           mediumtext                             null,
    time_updated   int unsigned default 0                 null,
    updated_at     timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8mb4_bin;

create index updated_at
    on user_profile (updated_at);

create index username_idx
    on user_profile (username);

create table user_promotion
(
    user_id      int unsigned               not null,
    promotion_id int unsigned               not null,
    status       tinyint unsigned default 0 null,
    primary key (user_id, promotion_id)
)
    collate = utf8_unicode_ci;

create table user_promotion_track
(
    track_id       bigint auto_increment
        primary key,
    user_id        int unsigned               not null,
    promotion_id   int unsigned               not null,
    time_requested int unsigned     default 0 null,
    status         tinyint unsigned default 0 null,
    reason         varchar(50)                not null
)
    collate = utf8_unicode_ci;

create index status_idx
    on user_promotion_track (status, reason);

create index user_promotion_idx
    on user_promotion_track (user_id, promotion_id);

create table user_recent_friends
(
    user_id      int unsigned                  not null,
    friend_id    int unsigned                  not null,
    priority     tinyint(1) unsigned default 0 not null,
    time_updated int unsigned        default 0 null,
    primary key (user_id, friend_id, priority)
)
    collate = utf8_unicode_ci;

create index user_priority_time
    on user_recent_friends (user_id, priority, time_updated);

create table user_recent_search
(
    user_id       int unsigned not null,
    search        varchar(100) not null,
    context_key   varchar(20)  not null,
    context_value varchar(30)  not null,
    search_hash   varchar(40)  not null,
    time_added    int unsigned null,
    primary key (user_id, search_hash)
)
    collate = utf8_unicode_ci;

create table user_rediscovery_status
(
    user_id                    int unsigned                not null
        primary key,
    backfill_complete          tinyint unsigned  default 0 null,
    first_rediscovery_complete tinyint unsigned  default 0 null,
    first_preferences_complete tinyint unsigned  default 0 null,
    save_cnt                   smallint unsigned default 0 null,
    dirty_cnt                  smallint unsigned default 0 null,
    impression_cnt             smallint unsigned default 0 null,
    process_cnt                smallint unsigned default 0 null,
    time_last_processed        int unsigned                null,
    time_updated               int unsigned                null
)
    charset = utf8;

create index time_updated_idx
    on user_rediscovery_status (time_updated);

create table user_search_backfill_status
(
    user_id               int unsigned               not null
        primary key,
    backfill_complete     tinyint unsigned default 0 null,
    backfill_cnt          int unsigned     default 0 null,
    notified              tinyint unsigned default 0 null,
    time_backfill_started int unsigned               null,
    time_updated          int unsigned               null
)
    collate = utf8_unicode_ci;

create index backfill_idx
    on user_search_backfill_status (backfill_complete);

create index notified_idx
    on user_search_backfill_status (notified);

create table user_setting
(
    user_id      int unsigned                           not null,
    setting_id   int unsigned                           not null,
    value        varchar(100)                           null,
    time_updated int unsigned default 0                 null,
    updated_at   timestamp    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, setting_id)
)
    collate = utf8_unicode_ci;

create index updated_at
    on user_setting (updated_at);

create table user_shared_lists
(
    user_id     int unsigned        not null,
    tag         varchar(25)         not null,
    public      tinyint(1) unsigned not null,
    title       varchar(255)        null,
    description text                not null,
    primary key (user_id, tag)
)
    collate = utf8_unicode_ci;

create table user_stripe
(
    user_id      int unsigned                  not null,
    stripe_id    varchar(255) collate utf8_bin not null,
    card_type    tinyint unsigned              null,
    last_four    varchar(4)                    not null,
    expire_month smallint unsigned             not null,
    expire_year  smallint unsigned             not null,
    time_added   int unsigned                  not null,
    livemode     tinyint unsigned default 0    not null,
    primary key (user_id, livemode)
)
    collate = utf8_unicode_ci;

create index stripe_idx
    on user_stripe (stripe_id);

create table user_subscription
(
    user_subscription_id int unsigned auto_increment
        primary key,
    source_id            varchar(255) collate utf8_bin              not null,
    user_id              int unsigned                               not null,
    subscription_id      int unsigned                               not null,
    coupon_id            int unsigned     default 0                 null,
    purchase_date        int unsigned                               not null,
    renew_date           int unsigned                               not null,
    cancel_date          int unsigned     default 0                 null,
    status               tinyint unsigned default 0                 null,
    amount_per_period    int unsigned     default 0                 null,
    currency             varchar(10)                                not null,
    is_primary           tinyint unsigned default 0                 null,
    livemode             tinyint unsigned default 0                 null,
    updated_at           timestamp        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index source_idx
    on user_subscription (source_id, is_primary);

create index status_cancel_idx
    on user_subscription (status, is_primary, livemode, cancel_date);

create index status_purchase_idx
    on user_subscription (status, is_primary, livemode, purchase_date);

create index status_renew_idx
    on user_subscription (status, is_primary, livemode, renew_date);

create index updated_at
    on user_subscription (updated_at);

create index user_status_idx
    on user_subscription (user_id, status);

create index user_subscription_idx
    on user_subscription (user_id, subscription_id, livemode);

create table user_subscription_history
(
    history_id            bigint unsigned auto_increment
        primary key,
    source_id             varchar(255) collate utf8_bin              not null,
    log_id                bigint unsigned                            not null,
    user_subscription_id  int unsigned                               not null,
    user_id               int unsigned                               not null,
    api_id                mediumint unsigned                         not null,
    subscription_source   tinyint unsigned                           not null,
    subscription_id       int unsigned                               not null,
    coupon_id             int unsigned     default 0                 null,
    line_item_type        varchar(40)                                not null,
    purchase_date         int unsigned                               not null,
    amount_due            int(10)          default 0                 null,
    amount_discounted     int(10)          default 0                 null,
    amount_paid           int(10)          default 0                 null,
    amount_refunded       int(10)          default 0                 null,
    amount_fee            int(10)          default 0                 null,
    currency              varchar(10)                                not null,
    exchange_rate         float            default 0                 null,
    amount_due_usd        int(10)          default 0                 null,
    amount_discounted_usd int(10)          default 0                 null,
    amount_paid_usd       int(10)          default 0                 null,
    amount_refunded_usd   int(10)          default 0                 null,
    amount_fee_usd        int(10)          default 0                 null,
    time_added            int unsigned                               not null,
    card_type             tinyint unsigned                           not null,
    last_four             varchar(4)                                 null,
    livemode              tinyint unsigned default 0                 null,
    reconciled            tinyint unsigned default 0                 null,
    updated_at            timestamp        default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index api_idx
    on user_subscription_history (api_id, livemode);

create index log_idx
    on user_subscription_history (subscription_source, log_id);

create index reconciled_idx
    on user_subscription_history (reconciled, livemode);

create index source_idx
    on user_subscription_history (source_id);

create index updated_at
    on user_subscription_history (updated_at);

create index user_idx
    on user_subscription_history (user_id, livemode);

create index user_source_idx
    on user_subscription_history (user_id, source_id);

create index user_subscription_idx
    on user_subscription_history (user_subscription_id);

create table user_suggested_tags_status
(
    user_id             int unsigned               not null
        primary key,
    tags_status         tinyint unsigned default 0 null,
    mapping_complete    tinyint unsigned default 0 null,
    tag_add_cnt         int unsigned     default 0 null,
    tag_remove_cnt      int unsigned     default 0 null,
    process_cnt         int unsigned     default 0 null,
    time_last_processed int unsigned               null,
    time_updated        int unsigned               null
)
    collate = utf8_unicode_ci;

create index time_updated_idx
    on user_suggested_tags_status (time_updated);

create table user_track
(
    user_track_id bigint auto_increment
        primary key,
    user_id       int unsigned                 not null,
    session_id    int unsigned       default 0 null,
    api_id        mediumint unsigned default 0 null,
    app_name      varchar(20)                  null,
    app_version   varchar(20)                  null,
    os_type       varchar(20)                  null,
    os_version    varchar(20)                  null,
    device_mfg    varchar(20)                  null,
    device_name   varchar(20)                  null,
    device_type   varchar(20)                  null,
    store_name    varchar(20)                  null,
    section       varchar(20)                  null,
    view          varchar(20)                  null,
    event         varchar(20)                  null,
    version       varchar(20)                  null,
    time_updated  datetime                     not null
)
    collate = utf8_unicode_ci;

create table user_twitter_auth
(
    user_id            int unsigned                         not null
        primary key,
    oauth_token        varchar(255) collate utf8_unicode_ci not null,
    oauth_token_secret varchar(255) collate utf8_unicode_ci not null,
    time_created       int unsigned default 0               null
)
    charset = utf8;

create table user_upday_account
(
    user_id     int unsigned                         not null
        primary key,
    upday_email varchar(150) collate utf8_unicode_ci not null,
    api_id      mediumint unsigned                   not null
)
    charset = utf8;

create index upday_email_idx
    on user_upday_account (upday_email);

create table user_web_session_tokens
(
    token_id     bigint auto_increment
        primary key,
    user_id      int unsigned         not null,
    look_up      varchar(64)          not null,
    time_created datetime             null,
    time_expired datetime             null,
    status       tinyint(1) default 0 null,
    constraint user_id
        unique (user_id, look_up)
)
    collate = utf8_unicode_ci;

create table user_wildtangent_info
(
    guid                 bigint unsigned                      not null
        primary key,
    v1                   varchar(255) collate utf8_unicode_ci not null,
    v2                   varchar(255) collate utf8_unicode_ci not null,
    v3                   varchar(255) collate utf8_unicode_ci not null,
    v4                   varchar(255) collate utf8_unicode_ci not null,
    v5                   varchar(255) collate utf8_unicode_ci not null,
    synced               tinyint unsigned default 0           not null,
    is_new_user          tinyint unsigned default 0           not null,
    user_id              int unsigned                         null,
    user_subscription_id int unsigned                         null,
    subscription_type    varchar(30) collate utf8_unicode_ci  null,
    amount_per_period    int unsigned     default 0           null,
    currency             varchar(10) collate utf8_unicode_ci  null,
    time_created         int unsigned     default 0           null,
    time_synced          int unsigned     default 0           null
)
    charset = utf8;

create index synced_idx
    on user_wildtangent_info (synced);

create index user_idx
    on user_wildtangent_info (user_id);

create index user_subscription_idx
    on user_wildtangent_info (user_subscription_id);

create table users
(
    user_id        int unsigned auto_increment
        primary key,
    feed_id        varchar(20)                                   not null,
    password       varchar(64)                                   not null,
    email          varchar(150) collate utf8_unicode_ci          not null,
    first_name     varchar(50) collate utf8_unicode_ci           not null,
    last_name      varchar(50) collate utf8_unicode_ci           not null,
    feed_protected tinyint unsigned                              not null,
    login_hash     varchar(42)                                   not null,
    birth          datetime                                      not null,
    last_syncer    varchar(42)                                   not null,
    api_id         mediumint unsigned                            not null,
    premium_status tinyint(1) unsigned default 0                 null,
    updated_at     timestamp           default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    auth_user_id   char(10) collate latin1_bin                   null,
    constraint auth_user_id
        unique (auth_user_id),
    constraint feed_id
        unique (feed_id)
);

create index api_id
    on users (api_id);

create index birth
    on users (birth);

create index email
    on users (email);

create index password
    on users (password);

create index updated_at
    on users (updated_at);

create table users_ac_emails
(
    user_id   int unsigned not null,
    friend_id int unsigned not null,
    email     varchar(150) not null,
    status    tinyint(1)   not null,
    primary key (user_id, friend_id, email)
)
    collate = utf8_unicode_ci;

create index email
    on users_ac_emails (email);

create table users_admin
(
    user_id     int unsigned auto_increment
        primary key,
    pkt_user_id int unsigned     default 0                 not null,
    ldap_id     varchar(255)                               not null,
    created_at  timestamp        default CURRENT_TIMESTAMP not null,
    updated_at  timestamp        default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    expires_at  timestamp                                  null,
    status      tinyint unsigned default 0                 not null,
    fname       varchar(128)                               null,
    lname       varchar(128)                               null,
    constraint ldap_id_idx
        unique (ldap_id)
);

create table users_blocked
(
    user_id         int unsigned not null,
    blocked_user_id int unsigned not null,
    time_blocked    int unsigned not null,
    primary key (user_id, blocked_user_id)
)
    collate = utf8_unicode_ci;

create index user_item
    on users_blocked (blocked_user_id);

create table users_bronto
(
    user_id           int unsigned                         not null
        primary key,
    bronto_contact_id varchar(255) collate utf8_unicode_ci not null,
    constraint bronto_contact_id
        unique (bronto_contact_id)
)
    charset = utf8;

create table users_collections_following
(
    user_id            int unsigned                  not null,
    collection_user_id int unsigned                  not null,
    tag                varchar(25)                   not null,
    following_status   tinyint(1) unsigned default 0 null,
    time_created       int unsigned                  not null,
    time_updated       int unsigned                  not null,
    primary key (user_id, collection_user_id, tag)
)
    collate = utf8_unicode_ci;

create index collection_user_tag_idx
    on users_collections_following (collection_user_id, tag);

create table users_device_ids
(
    user_id int unsigned     not null,
    device  tinyint unsigned not null,
    type    tinyint unsigned not null,
    id      varchar(40)      not null,
    birth   datetime         not null,
    primary key (user_id, device, type, id)
);

create index birth
    on users_device_ids (birth);

create index id
    on users_device_ids (id);

create table users_devices_check_log
(
    device_id    varchar(50)        not null,
    api_id       mediumint unsigned not null,
    time_checked datetime           not null
);

create index device_id
    on users_devices_check_log (device_id);

create index time_checked
    on users_devices_check_log (time_checked);

create table users_friends
(
    user_id    int unsigned                        not null,
    friend_id  int unsigned                        not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, friend_id)
)
    collate = utf8_unicode_ci;

create index idx_friend_id
    on users_friends (friend_id);

create index updated_at
    on users_friends (updated_at);

create table users_friends_following
(
    user_id          int unsigned                  not null,
    friend_user_id   int unsigned                  not null,
    following_status tinyint(1) unsigned default 1 null,
    time_created     int unsigned                  not null,
    time_updated     int unsigned                  not null,
    primary key (user_id, friend_user_id)
)
    collate = utf8_unicode_ci;

create index friend_user_idx
    on users_friends_following (friend_user_id);

create table users_meta
(
    user_id      int unsigned                        not null,
    property     tinyint unsigned                    not null,
    value        text                                not null,
    time_updated datetime                            not null,
    updated_at   timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, property, time_updated)
);

create index property
    on users_meta (property);

create index time_updated
    on users_meta (time_updated);

create index updated_at
    on users_meta (updated_at);

create table users_meta_properties
(
    property_id tinyint unsigned auto_increment
        primary key,
    name        text not null
);

create table users_services
(
    user_id    int unsigned                        not null,
    service_id tinyint unsigned                    not null,
    username   varchar(100)                        not null,
    confirmed  tinyint                             not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, service_id, username)
)
    collate = utf8_unicode_ci;

create index service_id
    on users_services (service_id, username);

create index updated_at
    on users_services (updated_at);

create table users_settings_notifications
(
    user_id    int unsigned                        not null,
    service_id tinyint unsigned                    not null,
    value      tinyint(1) unsigned                 not null,
    updated_at timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, service_id)
)
    collate = utf8_unicode_ci;

create index updated_at
    on users_settings_notifications (updated_at);

create table users_social_ids
(
    id                bigint unsigned auto_increment
        primary key,
    user_id           int unsigned                        not null,
    service_user_id   varchar(255)                        not null,
    social_service_id int unsigned                        not null,
    source            varchar(255)                        not null,
    updated_at        timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index updated_at
    on users_social_ids (updated_at);

create index users_social_ids_service_user_id_social_service_id_index
    on users_social_ids (service_user_id, social_service_id);

create table users_social_services
(
    user_id           int unsigned       default 0                 not null,
    api_id            mediumint unsigned default 0                 not null,
    social_service_id smallint unsigned  default 0                 not null,
    name              varchar(255)                                 not null,
    time_added        int                                          not null,
    time_updated      int                                          not null,
    updated_at        timestamp          default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    primary key (user_id, social_service_id, api_id, name)
)
    collate = utf8_unicode_ci;

create index social_service_idx
    on users_social_services (social_service_id, name);

create index updated_at
    on users_social_services (updated_at);

create table users_social_tokens
(
    users_social_token_id int unsigned auto_increment
        primary key,
    user_id               int unsigned                        not null,
    social_service_id     smallint unsigned                   not null,
    data                  text                                null,
    time_created          int                                 null,
    status                tinyint                             not null,
    updated_at            timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    collate = utf8_unicode_ci;

create index updated_at
    on users_social_tokens (updated_at);

create index user_id
    on users_social_tokens (user_id, social_service_id);

create table users_time
(
    user_id int unsigned       not null,
    app_id  mediumint unsigned not null,
    minutes decimal(7, 1)      not null,
    primary key (user_id, app_id)
)
    collate = utf8_unicode_ci;

create table users_tokens
(
    user_id    int unsigned     not null,
    service_id tinyint unsigned not null,
    device_id  bigint unsigned  null,
    token      varchar(200)     not null,
    status     tinyint          not null,
    primary key (user_id, service_id, token)
)
    collate = utf8_unicode_ci;

create index device_idx
    on users_tokens (device_id);

create index service_id
    on users_tokens (service_id, token);

create table vars
(
    var   varchar(20) not null
        primary key,
    value varchar(35) not null
)
    collate = utf8_unicode_ci;

create table view_segment
(
    id                       bigint auto_increment
        primary key,
    view_segment_id          int unsigned       not null,
    guid                     bigint unsigned    not null,
    user_id                  bigint unsigned    not null,
    api_id                   mediumint unsigned not null,
    app_session_id           int unsigned       not null,
    app_segment_id           int unsigned       not null,
    item_id                  int unsigned       null,
    referral_view_segment_id int unsigned       null,
    start_time               datetime           not null,
    end_time                 datetime           null,
    seconds                  int unsigned       null,
    constraint view_segment_guid
        unique (view_segment_id, guid)
)
    collate = utf8_unicode_ci;

create index api_id
    on view_segment (api_id);

create index app_segment_id
    on view_segment (app_segment_id);

create index app_session_id
    on view_segment (app_session_id);

create index end_time
    on view_segment (end_time);

create index guid
    on view_segment (guid);

create index item_id
    on view_segment (item_id);

create index ref_id
    on view_segment (referral_view_segment_id);

create index seconds
    on view_segment (seconds);

create index start_time
    on view_segment (start_time);

create index user_id
    on view_segment (user_id);

