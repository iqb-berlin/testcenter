#!/bin/bash
source backend/test/initialization/functions/functions.sh

echo_h1 "Blank installation of current Version";

take_current_version

php backend/initialize.php

expect_init_script_ok
expect_data_dir_equals sample_content_present
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows users 1

echo_h2 "Restart should work and do nothing"

php backend/initialize.php

expect_init_script_ok
expect_data_dir_equals sample_content_present
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows users 1