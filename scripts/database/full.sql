-- IQB-Testcenter DB 14.3.0

create table `users` (
  `id` bigint unsigned not null auto_increment,
  `name` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `password` varchar(100) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `email` varchar(100) character set utf8mb3 collate utf8mb3_german2_ci default null,
  `is_superadmin` tinyint(1) not null default '0',
  primary key (`id`)
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate users; -- to reset auto-increment

create table `workspaces` (
  `id` bigint unsigned not null auto_increment,
  `name` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  primary key (`id`)
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate workspaces; -- to reset auto-increment

create table `login_sessions` (
  `id` bigint unsigned not null auto_increment,
  `name` varchar(50) character set utf8mb3 collate utf8mb3_bin not null,
  `workspace_id` bigint unsigned not null,
  `token` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `group_name` varchar(100) collate utf8mb3_german2_ci not null,
  primary key (`id`),
  unique key `unique_login_session` (`name`),
  key `index_fk_login_workspace` (`workspace_id`) using btree,
  key `index_fk_logins` (`name`),
  key `index_fk_login_session_login` (`id`),
  key `login_sessions_token_index` (`token`),
  constraint `fk_login_workspace` foreign key (`workspace_id`) references `workspaces` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate login_sessions; -- to reset auto-increment

create table `person_sessions` (
  `id` bigint unsigned not null auto_increment,
  `code` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `login_sessions_id` bigint unsigned not null,
  `valid_until` timestamp null default null,
  `token` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `name_suffix` varchar(100) collate utf8mb3_german2_ci default null,
  primary key (`id`),
  unique key `person_sessions_id_uindex` (`id`),
  unique key `unique_person_session_token` (`token`),
  unique key `unique_person_session` (`login_sessions_id`, `name_suffix`),
  key `index_fk_person_login` (`login_sessions_id`) using btree,
  key `person_sessions_token_index` (`token`),
  constraint `fk_person_login` foreign key (`login_sessions_id`) references `login_sessions` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate person_sessions; -- to reset auto-increment

create table `tests` (
  `id` bigint unsigned not null auto_increment,
  `name` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `person_id` bigint unsigned not null,
  `laststate` text character set utf8mb3 collate utf8mb3_german2_ci,
  `locked` tinyint(1) not null default '0',
  `label` varchar(100) character set utf8mb3 collate utf8mb3_german2_ci default null,
  `running` tinyint(1) not null default '0',
  `timestamp_server` timestamp null default current_timestamp,
  primary key (`id`),
  key `index_fk_booklet_person` (`person_id`) using btree,
  constraint `fk_booklet_person` foreign key (`person_id`) references `person_sessions` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate tests; -- to reset auto-increment

create table `units` (
  `id` bigint unsigned not null auto_increment,
  `name` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci not null,
  `booklet_id` bigint unsigned not null,
  `laststate` text character set utf8mb3 collate utf8mb3_german2_ci,
  primary key (`id`),
  key `index_fk_unit_booklet` (`booklet_id`) using btree,
  constraint `fk_unit_booklet` foreign key (`booklet_id`) references `tests` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate units; -- to reset auto-increment

create table `admin_sessions` (
  `token` varchar(50) collate utf8mb3_german2_ci not null,
  `user_id` bigint unsigned not null,
  `valid_until` timestamp not null on update current_timestamp,
  primary key (`token`),
  key `index_fk_users_admintokens` (`user_id`) using btree,
  constraint `fk_users_admintokens` foreign key (`user_id`) references `users` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate admin_sessions; -- to reset auto-increment

create table `test_commands` (
  `id` bigint unsigned not null,
  `test_id` bigint unsigned not null,
  `keyword` varchar(50) not null,
  `parameter` text,
  `commander_id` bigint unsigned default null,
  `timestamp` timestamp not null,
  `executed` tinyint(1) default '0',
  primary key (`id`, `test_id`),
  unique key `test_commands_id_uindex` (`id`, `test_id`),
  key `test_commands_person_sessions_id_fk` (`commander_id`),
  key `test_commands_tests_id_fk` (`test_id`),
  constraint `test_commands_person_sessions_id_fk` foreign key (`commander_id`) references `person_sessions` (`id`) on delete set null,
  constraint `test_commands_tests_id_fk` foreign key (`test_id`) references `tests` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb4
  collate = utf8mb4_0900_ai_ci;
truncate test_commands; -- to reset auto-increment

create table `test_logs` (
  `booklet_id` bigint unsigned not null,
  `timestamp` bigint not null default '0',
  `logentry` text character set utf8mb3 collate utf8mb3_german2_ci,
  `timestamp_server` timestamp null default current_timestamp,
  key `index_fk_log_booklet` (`booklet_id`) using btree,
  constraint `fk_log_booklet` foreign key (`booklet_id`) references `tests` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate test_logs; -- to reset auto-increment

create table `test_reviews` (
  `booklet_id` bigint unsigned not null,
  `reviewtime` timestamp not null default current_timestamp on update current_timestamp,
  `priority` tinyint(1) not null default '0',
  `categories` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci default null,
  `entry` text character set utf8mb3 collate utf8mb3_german2_ci,
  key `index_fk_review_booklet` (`booklet_id`) using btree,
  constraint `fk_review_booklet` foreign key (`booklet_id`) references `tests` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate test_reviews; -- to reset auto-increment

create table `logins` (
  `name` varchar(50) character set utf8mb3 collate utf8mb3_bin not null,
  `password` varchar(100) collate utf8mb3_german2_ci not null,
  `mode` varchar(20) collate utf8mb3_german2_ci not null,
  `workspace_id` bigint unsigned default null,
  `codes_to_booklets` text collate utf8mb3_german2_ci,
  `source` varbinary(120) not null,
  `valid_from` timestamp null default null,
  `valid_to` timestamp null default null,
  `valid_for` int default null,
  `group_name` varchar(100) collate utf8mb3_german2_ci default null,
  `group_label` text collate utf8mb3_german2_ci,
  `custom_texts` text collate utf8mb3_german2_ci,
  primary key (`name`),
  key `logins_workspaces_id_fk` (`workspace_id`),
  constraint `logins_workspaces_id_fk` foreign key (`workspace_id`) references `workspaces` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate logins; -- to reset auto-increment

create table `unit_logs` (
  `unit_id` bigint unsigned not null,
  `timestamp` bigint not null default '0',
  `logentry` text character set utf8mb3 collate utf8mb3_german2_ci,
  key `index_fk_log_unit` (`unit_id`) using btree,
  constraint `fk_log_unit` foreign key (`unit_id`) references `units` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate unit_logs; -- to reset auto-increment

create table `unit_reviews` (
  `unit_id` bigint unsigned not null,
  `reviewtime` timestamp not null default current_timestamp on update current_timestamp,
  `priority` tinyint(1) not null default '0',
  `categories` varchar(50) character set utf8mb3 collate utf8mb3_german2_ci default null,
  `entry` text character set utf8mb3 collate utf8mb3_german2_ci,
  key `index_fk_review_unit` (`unit_id`) using btree,
  constraint `fk_review_unit` foreign key (`unit_id`) references `units` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate unit_reviews; -- to reset auto-increment

create table `workspace_users` (
  `workspace_id` bigint unsigned not null,
  `user_id` bigint unsigned not null,
  `role` varchar(10) character set utf8mb3 collate utf8mb3_german2_ci not null default 'RW',
  primary key (`workspace_id`, `user_id`),
  key `index_fk_workspace_users_user` (`user_id`) using btree,
  key `index_fk_workspace_users_workspace` (`workspace_id`) using btree,
  constraint `fk_workspace_users_user` foreign key (`user_id`) references `users` (`id`) on delete cascade,
  constraint `fk_workspace_users_workspace` foreign key (`workspace_id`) references `workspaces` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate workspace_users; -- to reset auto-increment

create table `meta` (
  `metaKey` varchar(100) not null,
  `value` mediumblob,
  `category` varchar(30) default null,
  unique key `meta_pk` (`metaKey`, `category`),
  unique key `meta_metaKey_category_uindex` (`metaKey`, `category`)
) engine = InnoDB
  default charset = utf8mb4
  collate = utf8mb4_0900_ai_ci;
truncate meta; -- to reset auto-increment

create table `unit_data` (
  `unit_id` bigint unsigned not null,
  `part_id` varchar(50) not null,
  `content` longtext,
  `ts` bigint not null default '0',
  `response_type` varchar(50) default null,
  primary key (`unit_id`, `part_id`),
  constraint `unit_data_units_id_fk` foreign key (`unit_id`) references `units` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb4
  collate = utf8mb4_0900_ai_ci;
truncate unit_data; -- to reset auto-increment

create table `files` (
  `workspace_id` bigint unsigned not null,
  `name` varbinary(120) not null,
  `id` varchar(120) collate utf8mb3_german2_ci not null,
  `version_mayor` int default null,
  `version_minor` int default null,
  `version_patch` int default null,
  `version_label` text collate utf8mb3_german2_ci,
  `label` text collate utf8mb3_german2_ci,
  `description` text collate utf8mb3_german2_ci,
  `type` enum ('Testtakers','SysCheck','Booklet','Unit','Resource') collate utf8mb3_german2_ci not null,
  `verona_module_type` enum ('player','schemer','editor','') collate utf8mb3_german2_ci default null,
  `verona_version` varchar(12) collate utf8mb3_german2_ci default null,
  `verona_module_id` varchar(50) collate utf8mb3_german2_ci default null,
  `is_valid` tinyint(1) not null,
  `validation_report` text collate utf8mb3_german2_ci,
  `modification_ts` timestamp not null,
  `size` int not null,
  `context_data` text collate utf8mb3_german2_ci,
  primary key (`workspace_id`, `name`, `type`),
  unique key `unique_id` (`workspace_id`, `id`, `type`),
  key `files_workspace_id_name_index` (`workspace_id`, `name`),
  key `files_id_index` (`id`),
  key `file_relations_subject_index` (`workspace_id`, `name`, `type`),
  constraint `files_workspaces_id_fk` foreign key (`workspace_id`) references `workspaces` (`id`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate files; -- to reset auto-increment

create table `unit_defs_attachments` (
  `workspace_id` bigint unsigned not null,
  `unit_name` varchar(120) collate utf8mb3_german2_ci not null,
  `booklet_name` varchar(120) collate utf8mb3_german2_ci not null,
  `attachment_type` enum ('capture-image') collate utf8mb3_german2_ci not null,
  `variable_id` varchar(100) collate utf8mb3_german2_ci not null,
  `file_type` enum ('Testtakers','SysCheck','Booklet','Unit','Resource') collate utf8mb3_german2_ci generated always as (_utf8mb4'Booklet') stored,
  primary key (`booklet_name`, `unit_name`, `variable_id`, `workspace_id`),
  key `files_fk` (`workspace_id`, `booklet_name`, `file_type`),
  constraint `files_fk` foreign key (`workspace_id`, `booklet_name`, `file_type`) references `files` (`workspace_id`, `id`, `type`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate unit_defs_attachments; -- to reset auto-increment

create table `file_relations` (
  `workspace_id` bigint unsigned not null,
  `subject_name` varbinary(120) not null,
  `subject_type` enum ('Testtakers','SysCheck','Booklet','Unit','Resource') collate utf8mb3_german2_ci not null,
  `relationship_type` enum ('hasBooklet','containsUnit','usesPlayer','usesPlayerResource','isDefinedBy','unknown') collate utf8mb3_german2_ci not null,
  `object_type` enum ('Testtakers','SysCheck','Booklet','Unit','Resource') collate utf8mb3_german2_ci not null,
  `object_name` varbinary(120) default null,
  unique key `unique_combination` (`workspace_id`, `subject_name`, `subject_type`, `relationship_type`, `object_type`,
                                   `object_name`),
  constraint `file_relations_files_fk` foreign key (`workspace_id`, `subject_name`, `subject_type`) references `files` (`workspace_id`, `name`, `type`) on delete cascade
) engine = InnoDB
  default charset = utf8mb3
  collate = utf8mb3_german2_ci;
truncate file_relations; -- to reset auto-increment