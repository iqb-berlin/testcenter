-- IQB-Testcenter DB --

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `is_superadmin` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate users; -- to reset auto-increment

CREATE TABLE `workspaces` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL,
  `workspace_hash` varchar(255) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  `content_type` varchar(255) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT 'mixed',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate workspaces; -- to reset auto-increment

CREATE TABLE `login_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `workspace_id` bigint unsigned NOT NULL,
  `token` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL,
  `group_name` varchar(100) COLLATE utf8mb3_german2_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_login_session` (`name`,`workspace_id`),
  KEY `index_fk_login_workspace` (`workspace_id`) USING BTREE,
  KEY `index_fk_logins` (`name`),
  KEY `index_fk_login_session_login` (`id`),
  KEY `login_sessions_token_index` (`token`),
  KEY `login_sessions_groups_fk` (`workspace_id`,`group_name`),
  CONSTRAINT `fk_login_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate login_sessions; -- to reset auto-increment

CREATE TABLE `login_session_groups` (
  `workspace_id` bigint unsigned NOT NULL,
  `group_label` text COLLATE utf8mb3_german2_ci NOT NULL,
  `group_name` varchar(100) COLLATE utf8mb3_german2_ci NOT NULL,
  `token` varchar(50) COLLATE utf8mb3_german2_ci NOT NULL,
  PRIMARY KEY (`workspace_id`,`group_name`),
  UNIQUE KEY `login_session_groups_unique_token` (`token`),
  CONSTRAINT `login_sessions_fk` FOREIGN KEY (`workspace_id`, `group_name`) REFERENCES `login_sessions` (`workspace_id`, `group_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate login_session_groups; -- to reset auto-increment

CREATE TABLE `person_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL,
  `login_sessions_id` bigint unsigned NOT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `token` varchar(50) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `name_suffix` varchar(100) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `person_sessions_id_uindex` (`id`),
  UNIQUE KEY `unique_person_session` (`login_sessions_id`,`name_suffix`),
  KEY `index_fk_person_login` (`login_sessions_id`) USING BTREE,
  KEY `person_sessions_token_index` (`token`),
  CONSTRAINT `fk_person_login` FOREIGN KEY (`login_sessions_id`) REFERENCES `login_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate person_sessions; -- to reset auto-increment

CREATE TABLE `tests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(250) COLLATE utf8mb3_german2_ci NOT NULL,
  `person_id` bigint unsigned NOT NULL,
  `laststate` text CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `label` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `running` tinyint(1) NOT NULL DEFAULT '0',
  `timestamp_server` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_id` varchar(50) COLLATE utf8mb3_german2_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `index_fk_booklet_person` (`person_id`) USING BTREE,
  CONSTRAINT `fk_booklet_person` FOREIGN KEY (`person_id`) REFERENCES `person_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate tests; -- to reset auto-increment

CREATE TABLE `units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL,
  `booklet_id` bigint unsigned NOT NULL,
  `laststate` text CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci,
  `original_unit_id` varchar(255) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `index_fk_unit_booklet` (`booklet_id`) USING BTREE,
  CONSTRAINT `fk_unit_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate units; -- to reset auto-increment

CREATE TABLE `admin_sessions` (
  `token` varchar(50) COLLATE utf8mb3_german2_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `valid_until` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `index_fk_users_admintokens` (`user_id`) USING BTREE,
  CONSTRAINT `fk_users_admintokens` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate admin_sessions; -- to reset auto-increment

CREATE TABLE `test_commands` (
  `id` bigint unsigned NOT NULL,
  `test_id` bigint unsigned NOT NULL,
  `keyword` varchar(50) NOT NULL,
  `parameter` text,
  `commander_id` bigint unsigned DEFAULT NULL,
  `timestamp` timestamp NOT NULL,
  `executed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`,`test_id`),
  UNIQUE KEY `test_commands_id_uindex` (`id`,`test_id`),
  KEY `test_commands_person_sessions_id_fk` (`commander_id`),
  KEY `test_commands_tests_id_fk` (`test_id`),
  CONSTRAINT `test_commands_person_sessions_id_fk` FOREIGN KEY (`commander_id`) REFERENCES `person_sessions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `test_commands_tests_id_fk` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
truncate test_commands; -- to reset auto-increment

CREATE TABLE `test_logs` (
  `booklet_id` bigint unsigned NOT NULL,
  `timestamp` bigint NOT NULL DEFAULT '0',
  `logentry` text CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci,
  `timestamp_server` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `index_fk_log_booklet` (`booklet_id`) USING BTREE,
  CONSTRAINT `fk_log_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate test_logs; -- to reset auto-increment

CREATE TABLE `test_reviews` (
  `booklet_id` bigint unsigned NOT NULL,
  `reviewtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priority` tinyint(1) NOT NULL DEFAULT '0',
  `categories` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `entry` text CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci,
  `user_agent` varchar(512) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  KEY `index_fk_review_booklet` (`booklet_id`) USING BTREE,
  CONSTRAINT `fk_review_booklet` FOREIGN KEY (`booklet_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate test_reviews; -- to reset auto-increment

CREATE TABLE `logins` (
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `password` varchar(100) COLLATE utf8mb3_german2_ci NOT NULL,
  `mode` varchar(20) COLLATE utf8mb3_german2_ci NOT NULL,
  `workspace_id` bigint unsigned DEFAULT NULL,
  `codes_to_booklets` text COLLATE utf8mb3_german2_ci,
  `source` varbinary(120) NOT NULL,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_to` timestamp NULL DEFAULT NULL,
  `valid_for` int DEFAULT NULL,
  `group_name` varchar(100) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `group_label` text COLLATE utf8mb3_german2_ci,
  `custom_texts` text COLLATE utf8mb3_german2_ci,
  `monitors` text COLLATE utf8mb3_german2_ci,
  PRIMARY KEY (`name`),
  KEY `logins_workspaces_id_fk` (`workspace_id`),
  CONSTRAINT `logins_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate logins; -- to reset auto-increment

CREATE TABLE `unit_logs` (
  `unit_id` bigint unsigned NOT NULL,
  `timestamp` bigint NOT NULL DEFAULT '0',
  `logentry` text CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci,
  KEY `index_fk_log_unit` (`unit_id`) USING BTREE,
  CONSTRAINT `fk_log_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate unit_logs; -- to reset auto-increment

CREATE TABLE `unit_reviews` (
  `unit_id` bigint unsigned NOT NULL,
  `reviewtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priority` tinyint(1) NOT NULL DEFAULT '0',
  `categories` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `entry` text CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci,
  `page` bigint DEFAULT NULL,
  `pagelabel` varchar(255) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `user_agent` varchar(512) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  KEY `index_fk_review_unit` (`unit_id`) USING BTREE,
  CONSTRAINT `fk_review_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate unit_reviews; -- to reset auto-increment

CREATE TABLE `workspace_users` (
  `workspace_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_german2_ci NOT NULL DEFAULT 'RW',
  PRIMARY KEY (`workspace_id`,`user_id`),
  KEY `index_fk_workspace_users_user` (`user_id`) USING BTREE,
  KEY `index_fk_workspace_users_workspace` (`workspace_id`) USING BTREE,
  CONSTRAINT `fk_workspace_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workspace_users_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate workspace_users; -- to reset auto-increment

CREATE TABLE `meta` (
  `metaKey` varchar(100) NOT NULL,
  `value` mediumblob,
  `category` varchar(30) DEFAULT NULL,
  UNIQUE KEY `meta_pk` (`metaKey`,`category`),
  UNIQUE KEY `meta_metaKey_category_uindex` (`metaKey`,`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
truncate meta; -- to reset auto-increment

CREATE TABLE `unit_data` (
  `unit_id` bigint unsigned NOT NULL,
  `part_id` varchar(50) NOT NULL,
  `content` longtext,
  `ts` bigint NOT NULL DEFAULT '0',
  `response_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`unit_id`,`part_id`),
  CONSTRAINT `unit_data_units_id_fk` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
truncate unit_data; -- to reset auto-increment

CREATE TABLE `files` (
  `workspace_id` bigint unsigned NOT NULL,
  `name` varbinary(120) NOT NULL,
  `id` varchar(120) COLLATE utf8mb3_german2_ci NOT NULL,
  `version_mayor` int DEFAULT NULL,
  `version_minor` int DEFAULT NULL,
  `version_patch` int DEFAULT NULL,
  `version_label` text COLLATE utf8mb3_german2_ci,
  `label` text COLLATE utf8mb3_german2_ci,
  `description` text COLLATE utf8mb3_german2_ci,
  `type` enum('Testtakers','SysCheck','Booklet','Unit','Resource') COLLATE utf8mb3_german2_ci NOT NULL,
  `verona_module_type` enum('player','schemer','editor','') COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `verona_version` varchar(12) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `verona_module_id` varchar(50) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `is_valid` tinyint(1) NOT NULL,
  `validation_report` longtext COLLATE utf8mb3_german2_ci,
  `modification_ts` timestamp NOT NULL,
  `size` int NOT NULL,
  `context_data` text COLLATE utf8mb3_german2_ci,
  PRIMARY KEY (`workspace_id`,`name`,`type`),
  UNIQUE KEY `unique_id` (`workspace_id`,`id`,`type`),
  KEY `files_workspace_id_name_index` (`workspace_id`,`name`),
  KEY `files_id_index` (`id`),
  KEY `file_relations_subject_index` (`workspace_id`,`name`,`type`),
  CONSTRAINT `files_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate files; -- to reset auto-increment

CREATE TABLE `unit_defs_attachments` (
  `workspace_id` bigint unsigned NOT NULL,
  `unit_name` varchar(120) COLLATE utf8mb3_german2_ci NOT NULL,
  `booklet_name` varchar(120) COLLATE utf8mb3_german2_ci NOT NULL,
  `attachment_type` enum('capture-image') COLLATE utf8mb3_german2_ci NOT NULL,
  `variable_id` varchar(100) COLLATE utf8mb3_german2_ci NOT NULL,
  `file_type` enum('Testtakers','SysCheck','Booklet','Unit','Resource') COLLATE utf8mb3_german2_ci GENERATED ALWAYS AS (_utf8mb4'Booklet') STORED,
  PRIMARY KEY (`booklet_name`,`unit_name`,`variable_id`,`workspace_id`),
  KEY `files_fk` (`workspace_id`,`booklet_name`,`file_type`),
  CONSTRAINT `files_fk` FOREIGN KEY (`workspace_id`, `booklet_name`, `file_type`) REFERENCES `files` (`workspace_id`, `id`, `type`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate unit_defs_attachments; -- to reset auto-increment

CREATE TABLE `file_relations` (
  `workspace_id` bigint unsigned NOT NULL,
  `subject_name` varbinary(120) NOT NULL,
  `subject_type` enum('Testtakers','SysCheck','Booklet','Unit','Resource') COLLATE utf8mb3_german2_ci NOT NULL,
  `relationship_type` enum('hasBooklet','containsUnit','usesPlayer','usesPlayerResource','isDefinedBy','usesScheme','unknown') COLLATE utf8mb3_german2_ci NOT NULL,
  `object_type` enum('Testtakers','SysCheck','Booklet','Unit','Resource') COLLATE utf8mb3_german2_ci NOT NULL,
  `object_name` varbinary(120) DEFAULT NULL,
  UNIQUE KEY `unique_combination` (`workspace_id`,`subject_name`,`subject_type`,`relationship_type`,`object_type`,`object_name`),
  CONSTRAINT `file_relations_files_fk` FOREIGN KEY (`workspace_id`, `subject_name`, `subject_type`) REFERENCES `files` (`workspace_id`, `name`, `type`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;
truncate file_relations; -- to reset auto-increment