#!/bin/bash
source backend/test/initialization/functions/functions.sh

echo_h1 "Fresh installation with legacy-version of DB should work -- $MYSQL_DATABASE";
fake_version "5.0.0"
php backend/initialize.php \
  --dont_create_sample_data \
  --skip_read_workspace_files \
  --skip_db_integrity_check # because integrity check is always against current codebase, not faked version
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_5
expect_data_dir_equals empty_data_dir


echo_h1 "Update to later version";
fake_version "7.0.0"
php backend/initialize.php \
  --dont_create_sample_data \
  --skip_read_workspace_files \
  --skip_db_integrity_check
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_7


echo_h1 "Update version with meta-table";
fake_version "10.0.0"
php backend/initialize.php \
  --dont_create_sample_data \
  --skip_read_workspace_files \
  --skip_db_integrity_check
expect_init_script_ok
expect_db_structure_dump_equals blank_version_10


echo_h1 "Overwrite Existing Installation with no init data";
fake_version "5.0.0"
php backend/initialize.php \
  --dont_create_sample_data \
  --skip_read_workspace_files \
  --skip_db_integrity_check \
  --overwrite_existing_installation
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_5
expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0
