#!/bin/bash

source integration/test-init/tests/functions.sh

echo "## Test 1.1: Blank installation with legacy-version of DB";
fake_version "5.0.0"
php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=super_workspace \
--type=mysql \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--skip_db_integrity_check=true # because integrity check is always against current codebase, not faked version
expect_init_script_failed # because admin can not be established on old db structure
expect_db_structure_dump_equals blank_legacy_version_5
expect_data_dir_equals sample_content_present
expect_table_to_have_rows workspaces 1


echo "## Test 1.2: Update to later version";
fake_version "7.0.0"
php scripts/initialize.php --skip_db_integrity_check=true
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_7
expect_table_to_have_rows workspaces 1


echo "## Test 1.3: Update version with meta-table";
fake_version "10.0.0"
php scripts/initialize.php --skip_db_integrity_check=true
expect_init_script_ok
expect_db_structure_dump_equals blank_version_10
expect_table_to_have_rows workspaces 1


echo "## Test 1.4: Overwrite Existing Installation with no init data";
fake_version "5.0.0"
php scripts/initialize.php \
  --skip_db_integrity_check=true \
  --overwrite_existing_installation=true
expect_init_script_failed # because admin can not be established on old db structure
expect_db_structure_dump_equals blank_legacy_version_5
expect_data_dir_equals sample_content_missing
expect_table_to_have_rows workspaces 0

# TODO to test:
# workspace migration
# untouch current data
# config file present
# broken config
