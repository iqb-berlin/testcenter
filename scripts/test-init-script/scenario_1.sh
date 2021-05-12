#!/bin/bash

source /var/www/html/scripts/test-init-script/functions.sh

echo "## Test 1.1: Blank installation with legacy-version of DB";

fake_version "5.0.0"

php /var/www/html/scripts/initialize.php \
--user_name=$SUPERUSER_NAME \
--user_password=$SUPERUSER_PASSWORD \
--workspace=$WORKSPACE_NAME \
--test_login_name=$TEST_LOGIN_NAME \
--test_login_password=$TEST_LOGIN_PASSWORD \
--test_person_codes="xxx yyy" \
--type="mysql" \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--skip_db_integrity_check=true

expect_init_script_failed # because admin can not be established on old db struture
expect_dump_equals blank_legacy_version_5

echo "## Test 1.2: Update to later version";

fake_version "7.0.0"

php /var/www/html/scripts/initialize.php --skip_db_integrity_check=true

expect_init_script_ok
expect_dump_equals blank_legacy_version_7

echo "## Test 1.3: Update version with meta-table";

fake_version "10.0.0"

php /var/www/html/scripts/initialize.php --skip_db_integrity_check=true

expect_init_script_ok
expect_dump_equals blank_version_10
