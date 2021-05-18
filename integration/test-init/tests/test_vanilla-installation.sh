#!/bin/bash

source integration/test-init/tests/functions.sh

echo "## Test 2: Blank installation of current Version";

take_current_version

php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=a_beautiful_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD

expect_init_script_ok
expect_data_dir_equals sample_content_present
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows users 1

