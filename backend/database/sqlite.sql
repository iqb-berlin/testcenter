PRAGMA journal_mode = MEMORY;
PRAGMA foreign_keys = ON;

CREATE TABLE "admin_sessions"
(
    "token"       varchar(50) NOT NULL,
    "user_id"     bigint(20)  NOT NULL,
    "valid_until" timestamp   DEFAULT current_timestamp,
    PRIMARY KEY ("token"),
    CONSTRAINT "fk_users_admintokens" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "login_sessions"
(
    "id"           integer  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"         varchar(50) NOT NULL,
    "workspace_id" bigint(20)  NOT NULL,
    "group_name"   varchar(100) NOT NULL,
    "token"        varchar(50) NOT NULL,
    CONSTRAINT "fk_login_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "logins"
(
    "name"              varchar(50)  NOT NULL,
    "password"          varchar(100) NOT NULL,
    "mode"              varchar(20)  NOT NULL,
    "workspace_id"      bigint(20)   NOT NULL,
    "codes_to_booklets" text              DEFAULT NULL,
    "source"            varchar(30)       DEFAULT NULL,
    "valid_from"        timestamp    NULL DEFAULT NULL,
    "valid_to"          timestamp    NULL DEFAULT NULL,
    "valid_for"         int(11)           DEFAULT NULL,
    "group_name"        varchar(100)      DEFAULT NULL,
    "group_label"       text              DEFAULT NULL,
    "custom_texts"      text              DEFAULT NULL,
    PRIMARY KEY ("name")
);
CREATE TABLE "meta"
(
    "metaKey"  varchar(100) NOT NULL,
    "value"    mediumblob  DEFAULT NULL,
    "category" varchar(30) DEFAULT NULL
);
CREATE TABLE "person_sessions"
(
    "id"                integer  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code"              varchar(50) NOT NULL,
    "login_sessions_id" bigint(20)  NOT NULL,
    "valid_until"       timestamp   NULL DEFAULT NULL,
    "token"             varchar(50) NOT NULL,
    CONSTRAINT "fk_person_login" FOREIGN KEY ("login_sessions_id") REFERENCES "login_sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "test_commands"
(
    "id"           bigint(20)  NOT NULL,
    "test_id"      bigint(20)  NOT NULL,
    "keyword"      varchar(50) NOT NULL,
    "parameter"    text       DEFAULT NULL,
    "commander_id" bigint(20) DEFAULT NULL,
    "timestamp"    timestamp   NOT NULL,
    "executed"     tinyint(1) DEFAULT 0,
    PRIMARY KEY ("id", "test_id"),
    CONSTRAINT "test_commands_person_sessions_id_fk" FOREIGN KEY ("commander_id") REFERENCES "person_sessions" ("id") ON DELETE SET NULL,
    CONSTRAINT "test_commands_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE
);
CREATE TABLE "test_logs"
(
    "booklet_id"       bigint(20) NOT NULL,
    "timestamp"        bigint(20) NOT NULL DEFAULT 0,
    "logentry"         text                DEFAULT NULL,
    "timestamp_server" timestamp  NULL     DEFAULT current_timestamp,
    CONSTRAINT "fk_log_booklet" FOREIGN KEY ("booklet_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "test_reviews"
(
    "booklet_id" bigint(20) NOT NULL,
    "reviewtime" timestamp  NOT NULL DEFAULT current_timestamp,
    "priority"   tinyint(1) NOT NULL DEFAULT 0,
    "categories" varchar(50)         DEFAULT NULL,
    "entry"      text                DEFAULT NULL,
    CONSTRAINT "fk_review_booklet" FOREIGN KEY ("booklet_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "tests"
(
    "id"               integer  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"             varchar(50) NOT NULL,
    "person_id"        bigint(20)  NOT NULL,
    "laststate"        text                 DEFAULT NULL,
    "locked"           tinyint(1)  NOT NULL DEFAULT 0,
    "label"            varchar(100)         DEFAULT NULL,
    "running"          tinyint(1)  NOT NULL DEFAULT 0,
    "timestamp_server" timestamp   NULL     DEFAULT current_timestamp,
    CONSTRAINT "fk_booklet_person" FOREIGN KEY ("person_id") REFERENCES "person_sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "unit_data"
(
    "unit_id"       bigint(20)  NOT NULL,
    "part_id"       varchar(50) NOT NULL,
    "content"       text        NOT NULL,
    "ts"            bigint(20)  NOT NULL DEFAULT 0,
    "response_type" varchar(50)          DEFAULT NULL,
    PRIMARY KEY ("unit_id", "part_id"),
    CONSTRAINT "unit_data_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE CASCADE
);
CREATE TABLE "unit_logs"
(
    "unit_id"   bigint(20) NOT NULL,
    "timestamp" bigint(20) NOT NULL DEFAULT 0,
    "logentry"  text                DEFAULT NULL,
    CONSTRAINT "fk_log_unit" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "unit_reviews"
(
    "unit_id"    bigint(20) NOT NULL,
    "reviewtime" timestamp  NOT NULL DEFAULT current_timestamp,
    "priority"   tinyint(1) NOT NULL DEFAULT 0,
    "categories" varchar(50)         DEFAULT NULL,
    "entry"      text                DEFAULT NULL,
    CONSTRAINT "fk_review_unit" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "units"
(
    "id"         integer  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"       varchar(50) NOT NULL,
    "booklet_id" bigint(20)  NOT NULL,
    "laststate"  text DEFAULT NULL,
    CONSTRAINT "fk_unit_booklet" FOREIGN KEY ("booklet_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "users"
(
    "id"            integer   NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"          varchar(50)  NOT NULL,
    "password"      varchar(100) NOT NULL,
    "email"         varchar(100)          DEFAULT NULL,
    "is_superadmin" tinyint(1)   NOT NULL DEFAULT 0
);
CREATE TABLE "workspace_users"
(
    "workspace_id" bigint(20)  NOT NULL,
    "user_id"      bigint(20)  NOT NULL,
    "role"         varchar(10) NOT NULL DEFAULT 'RW',
    PRIMARY KEY ("workspace_id", "user_id"),
    CONSTRAINT "fk_workspace_users_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_workspace_users_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE "workspaces"
(
    "id"   integer  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(50) NOT NULL
);

create table files
(
    "workspace_id"       integer                                                                        not null,
    "name"               varchar(40)                                                                    not null,
    "id"                 varchar(40)                                                                        null,
    "version_mayor"      integer                                                                            null,
    "version_minor"      integer                                                                            null,
    "version_patch"      integer                                                                            null,
    "version_label"      text                                                                               null,
    "label"              text                                                                               null,
    "description"        text                                                                               null,
    "type"               text check (type in ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource')) not null,
    "verona_module_type" text check (verona_module_type in ('player', 'schemer', 'editor', ''))             null,
    "verona_version"     varchar(12)                                                                        null,
    "verona_module_id"   varchar(50)                                                                        null,
    constraint files_pk primary key (workspace_id, name, type),
    constraint files_workspaces_id_fk foreign key (workspace_id) references workspaces (id) on delete cascade
);

create index files_workspace_id_name_index on files (workspace_id, name);
create index files_id_index on files (id);


CREATE INDEX "unit_reviews_index_fk_review_unit" ON "unit_reviews" ("unit_id");
CREATE INDEX "test_commands_test_commands_id_uindex" ON "test_commands" ("id", "test_id");
CREATE INDEX "test_commands_test_commands_person_sessions_id_fk" ON "test_commands" ("commander_id");
CREATE INDEX "test_commands_test_commands_tests_id_fk" ON "test_commands" ("test_id");
CREATE INDEX "admin_sessions_index_fk_users_admintokens" ON "admin_sessions" ("user_id");
CREATE INDEX "unit_logs_index_fk_log_unit" ON "unit_logs" ("unit_id");
CREATE INDEX "tests_index_fk_booklet_person" ON "tests" ("person_id");
CREATE INDEX "test_reviews_index_fk_review_booklet" ON "test_reviews" ("booklet_id");
CREATE INDEX "meta_meta_pk" ON "meta" ("metaKey", "category");
CREATE INDEX "meta_meta_metaKey_category_uindex" ON "meta" ("metaKey", "category");
CREATE INDEX "test_logs_index_fk_log_booklet" ON "test_logs" ("booklet_id");
CREATE INDEX "person_sessions_person_sessions_id_uindex" ON "person_sessions" ("id");
CREATE INDEX "person_sessions_index_fk_person_login" ON "person_sessions" ("login_sessions_id");
CREATE INDEX "units_index_fk_unit_booklet" ON "units" ("booklet_id");
CREATE INDEX "login_sessions_index_fk_login_workspace" ON "login_sessions" ("workspace_id");
CREATE INDEX "login_sessions_index_fk_logins" ON "login_sessions" ("name");
CREATE INDEX "login_sessions_index_fk_login_session_login" ON "login_sessions" ("id");
CREATE INDEX "workspace_users_index_fk_workspace_users_user" ON "workspace_users" ("user_id");
CREATE INDEX "workspace_users_index_fk_workspace_users_workspace" ON "workspace_users" ("workspace_id");

