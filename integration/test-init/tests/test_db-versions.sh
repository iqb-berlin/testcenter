#!/bin/bash

source integration/test-init/tests/functions.sh

echo_h1 "Test 1.1: fresh installation with legacy-version of DB should work -- $MYSQL_DATABASE";
fake_version "5.0.0"
php scripts/initialize.php \
--workspace="" \
--user_name="" \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--skip_db_integrity_check=true # because integrity check is always against current codebase, not faked version
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_5
expect_data_dir_equals empty_data_dir


echo_h1 "Test 1.2: Update to later version";
fake_version "7.0.0"
php scripts/initialize.php \
--workspace "" \
--user_name "" \
--skip_db_integrity_check=true
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_7


echo_h1 "Test 1.3: Update version with meta-table";
fake_version "10.0.0"
php scripts/initialize.php \
--workspace "" \
--user_name "" \
--skip_db_integrity_check=true
expect_init_script_ok
expect_db_structure_dump_equals blank_version_10


echo_h1 "Test 1.4: Overwrite Existing Installation with no init data";
fake_version "5.0.0"
php scripts/initialize.php \
--workspace "" \
--user_name "" \
--skip_db_integrity_check=true \
--overwrite_existing_installation=true
expect_init_script_ok
expect_db_structure_dump_equals blank_legacy_version_5
expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0
