#!/usr/bin/env bash

source backend/test/initialization/functions/functions.sh

take_current_version

create_sample_folder ws_1
create_sample_folder ws_2

echo_h1 "Test 3.1: DB is missing, but a data folder is present";
# this scenario happened quite often, when db volume was deleted, but cleaning data dir was forgotten

php backend/initialize.php

expect_init_script_ok
expect_data_dir_equals restored_workspaces
expect_table_to_have_rows workspaces 2


echo_h1 "Test 3.2: Don't restore deleted workspace";
# eg after restart of container

delete_workspace 2

php backend/initialize.php

expect_init_script_ok
expect_table_to_have_rows workspaces 1


echo_h1 "Test 3.3: Overwrite existing installation if demanded";

php backend/initialize.php \
  --overwrite_existing_installation \
  --dont_create_sample_data

expect_init_script_ok
expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0

