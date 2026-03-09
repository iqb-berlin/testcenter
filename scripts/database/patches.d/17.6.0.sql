alter table login_session_groups
  add column last_modified timestamp not null default '1970-01-01 00:00:01';

alter table login_session_groups
  modify column last_modified timestamp not null;

-- Optimize polling for commands
CREATE INDEX `idx_test_commands_execution` ON `test_commands` (`test_id`, `executed`, `timestamp`);

-- Optimize review sorting and filtering
CREATE INDEX `idx_test_reviews_sorting` ON `test_reviews` (`booklet_id`, `person_id`, `reviewtime`);
CREATE INDEX `idx_unit_reviews_sorting` ON `unit_reviews` (`test_id`, `unit_name`, `person_id`, `reviewtime`);

alter table logins
  add column view_settings text;

