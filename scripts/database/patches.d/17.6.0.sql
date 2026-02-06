-- Optimize polling for commands
CREATE INDEX `idx_test_commands_execution` ON `test_commands` (`test_id`, `executed`, `timestamp`);

-- Optimize review sorting and filtering
CREATE INDEX `idx_test_reviews_sorting` ON `test_reviews` (`booklet_id`, `person_id`, `reviewtime`);
CREATE INDEX `idx_unit_reviews_sorting` ON `unit_reviews` (`test_id`, `unit_name`, `person_id`, `reviewtime`);