#!/usr/bin/env bash
source backend/test/initialization/functions/functions.sh

echo_h1 "Blank installation without sample data";

take_current_version

php backend/initialize.php --dont_create_sample_data

expect_init_script_ok
expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0
# the first administrator is not sample data: an installation without one cannot be logged into
expect_table_to_have_rows users 1

echo_h2 "Restart should work and do nothing"

php backend/initialize.php --dont_create_sample_data

expect_init_script_ok
expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0
expect_table_to_have_rows users 1
