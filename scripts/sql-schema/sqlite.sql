PRAGMA synchronous = OFF;
PRAGMA journal_mode = MEMORY;
BEGIN TRANSACTION;
CREATE TABLE `admin_sessions` (
  `token` varchar(50) NOT NULL
,  `user_id` integer  NOT NULL
,  `valid_until` timestamp NOT NULL DEFAULT current_timestamp
,  PRIMARY KEY (`token`)
,  CONSTRAINT `fk_users_admintokens` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE `test_logs` (
  `booklet_id` integer  NOT NULL
,  `timestamp` integer NOT NULL DEFAULT 0
,  `logentry` text DEFAULT NULL
,  `timestamp_server` timestamp NOT NULL DEFAULT current_timestamp
,  CONSTRAINT `fk_log_test` FOREIGN KEY (`booklet_id`) REFERENCES tests (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `test_reviews` (
  `booklet_id` integer  NOT NULL
,  `reviewtime` timestamp NOT NULL DEFAULT current_timestamp
,  `priority` integer NOT NULL DEFAULT 0
,  `categories` varchar(50) DEFAULT NULL
,  `entry` text DEFAULT NULL
,  CONSTRAINT `fk_review_test` FOREIGN KEY (`booklet_id`) REFERENCES tests (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `tests` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
,  `person_id` integer  NOT NULL
,  `laststate` text DEFAULT NULL
,  `locked` integer NOT NULL DEFAULT 0
,  `label` varchar(100) DEFAULT NULL
,  `running` integer NOT NULL DEFAULT 0
,  `timestamp_server` timestamp NOT NULL DEFAULT current_timestamp
,  CONSTRAINT `fk_booklet_person` FOREIGN KEY (`person_id`) REFERENCES person_sessions (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `login_sessions` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
,  `mode` varchar(20) NOT NULL
,  `workspace_id` integer  NOT NULL
,  `valid_until` timestamp
,  `token` varchar(50) NOT NULL
,  `codes_to_booklets` text DEFAULT NULL
,  `group_name` varchar(100) NOT NULL
,  `custom_texts` text DEFAULT NULL
,  CONSTRAINT `fk_login_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `person_sessions` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `code` varchar(50) NOT NULL
,  `login_id` integer  NOT NULL
,  `valid_until` timestamp
,  `token` varchar(50) NOT NULL
,  `laststate` text DEFAULT NULL
,  CONSTRAINT `fk_person_login` FOREIGN KEY (`login_id`) REFERENCES login_sessions (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `unit_logs` (
  `unit_id` integer  NOT NULL
,  `timestamp` integer NOT NULL DEFAULT 0
,  `logentry` text DEFAULT NULL
,  CONSTRAINT `fk_log_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `unit_reviews` (
  `unit_id` integer  NOT NULL
,  `reviewtime` timestamp NOT NULL DEFAULT current_timestamp
,  `priority` integer NOT NULL DEFAULT 0
,  `categories` varchar(50) DEFAULT NULL
,  `entry` text DEFAULT NULL
,  CONSTRAINT `fk_review_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `units` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
,  `booklet_id` integer  NOT NULL
,  `laststate` text DEFAULT NULL
,  `responses` text DEFAULT NULL
,  `responsetype` varchar(50) DEFAULT NULL
,  `responses_ts` integer NOT NULL DEFAULT 0
,  `restorepoint` text DEFAULT NULL
,  `restorepoint_ts` integer NOT NULL DEFAULT 0
,  CONSTRAINT `fk_unit_booklet` FOREIGN KEY (`booklet_id`) REFERENCES tests (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `users` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
,  `password` varchar(100) NOT NULL
,  `email` varchar(100) DEFAULT NULL
,  `is_superadmin` integer NOT NULL DEFAULT 0
);

CREATE TABLE `workspace_users` (
  `workspace_id` integer  NOT NULL
,  `user_id` integer  NOT NULL
,  `role` varchar(10) NOT NULL DEFAULT 'RW'
,  PRIMARY KEY (`workspace_id`,`user_id`)
,  CONSTRAINT `fk_workspace_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
,  CONSTRAINT `fk_workspace_users_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE `workspaces` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
);


create table `test_commands` (
    `id` integer not null
,   `test_id` bigint unsigned not null
,   `keyword` varchar(50) not null
,   `parameter` text null
,   `commander_id` bigint null
,   `timestamp` timestamp not null
,   `executed`  integer not null default 0
,   primary key (id, test_id)
,    constraint `test_commands_person_sessions_id_fk` foreign key (`commander_id`) references person_sessions (`id`) on delete set null on update no action
,    constraint test_commands_tests_id_fk foreign key (test_id) references tests (id) on delete cascade on update no action
);

CREATE INDEX "idx_admintokens_index_fk_users_admintokens" ON admin_sessions (`user_id`);
CREATE INDEX "idx_unitlogs_index_fk_log_unit" ON unit_logs (`unit_id`);
CREATE INDEX "idx_bookletlogs_index_fk_log_booklet" ON test_logs (`booklet_id`);
CREATE INDEX "idx_bookletreviews_index_fk_review_booklet" ON test_reviews (`booklet_id`);
CREATE INDEX "idx_persons_index_fk_person_login" ON person_sessions (`login_id`);
CREATE INDEX "idx_logins_index_fk_login_workspace" ON login_sessions (`workspace_id`);
CREATE INDEX "idx_units_index_fk_unit_booklet" ON "units" (`booklet_id`);
CREATE INDEX "idx_unitreviews_index_fk_review_unit" ON unit_reviews (`unit_id`);
CREATE INDEX "idx_workspace_users_index_fk_workspace_users_user" ON "workspace_users" (`user_id`);
CREATE INDEX "idx_workspace_users_index_fk_workspace_users_workspace" ON "workspace_users" (`workspace_id`);
CREATE INDEX "idx_tests_index_fk_booklet_person" ON tests (`person_id`);

create unique index "person_sessions_id_uindex" on person_sessions (`id`);


END TRANSACTION;
