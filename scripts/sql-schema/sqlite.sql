PRAGMA synchronous = OFF;
PRAGMA journal_mode = MEMORY;
BEGIN TRANSACTION;
CREATE TABLE `admintokens` (
  `id` varchar(50) NOT NULL
,  `user_id` integer  NOT NULL
,  `valid_until` timestamp NOT NULL DEFAULT current_timestamp 
,  PRIMARY KEY (`id`)
,  CONSTRAINT `fk_users_admintokens` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE `bookletlogs` (
  `booklet_id` integer  NOT NULL
,  `timestamp` integer NOT NULL DEFAULT 0
,  `logentry` text DEFAULT NULL
,  CONSTRAINT `fk_log_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `bookletreviews` (
  `booklet_id` integer  NOT NULL
,  `reviewtime` timestamp NOT NULL DEFAULT current_timestamp 
,  `reviewer` varchar(50) NOT NULL
,  `priority` integer NOT NULL DEFAULT 0
,  `categories` varchar(50) DEFAULT NULL
,  `entry` text DEFAULT NULL
,  CONSTRAINT `fk_review_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `booklets` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
,  `person_id` integer  NOT NULL
,  `laststate` text DEFAULT NULL
,  `locked` integer NOT NULL DEFAULT 0
,  `label` varchar(100) DEFAULT NULL
,  CONSTRAINT `fk_booklet_person` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `logins` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `name` varchar(50) NOT NULL
,  `mode` varchar(20) NOT NULL
,  `workspace_id` integer  NOT NULL
,  `valid_until` timestamp
,  `token` varchar(50) NOT NULL
,  `booklet_def` text DEFAULT NULL
,  `groupname` varchar(100) NOT NULL
,  CONSTRAINT `fk_login_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `persons` (
  `id` integer  NOT NULL PRIMARY KEY AUTOINCREMENT
,  `code` varchar(50) NOT NULL
,  `login_id` integer  NOT NULL
,  `valid_until` timestamp
,  `token` varchar(50) NOT NULL
,  `laststate` text DEFAULT NULL
,  CONSTRAINT `fk_person_login` FOREIGN KEY (`login_id`) REFERENCES `logins` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `unitlogs` (
  `unit_id` integer  NOT NULL
,  `timestamp` integer NOT NULL DEFAULT 0
,  `logentry` text DEFAULT NULL
,  CONSTRAINT `fk_log_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE `unitreviews` (
  `unit_id` integer  NOT NULL
,  `reviewtime` timestamp NOT NULL DEFAULT current_timestamp 
,  `reviewer` varchar(50) NOT NULL
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
,  CONSTRAINT `fk_unit_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `booklets` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
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

CREATE INDEX "idx_admintokens_index_fk_users_admintokens" ON "admintokens" (`user_id`);
CREATE INDEX "idx_unitlogs_index_fk_log_unit" ON "unitlogs" (`unit_id`);
CREATE INDEX "idx_bookletlogs_index_fk_log_booklet" ON "bookletlogs" (`booklet_id`);
CREATE INDEX "idx_bookletreviews_index_fk_review_booklet" ON "bookletreviews" (`booklet_id`);
CREATE INDEX "idx_persons_index_fk_person_login" ON "persons" (`login_id`);
CREATE INDEX "idx_logins_index_fk_login_workspace" ON "logins" (`workspace_id`);
CREATE INDEX "idx_units_index_fk_unit_booklet" ON "units" (`booklet_id`);
CREATE INDEX "idx_unitreviews_index_fk_review_unit" ON "unitreviews" (`unit_id`);
CREATE INDEX "idx_workspace_users_index_fk_workspace_users_user" ON "workspace_users" (`user_id`);
CREATE INDEX "idx_workspace_users_index_fk_workspace_users_workspace" ON "workspace_users" (`workspace_id`);
CREATE INDEX "idx_booklets_index_fk_booklet_person" ON "booklets" (`person_id`);
END TRANSACTION;
