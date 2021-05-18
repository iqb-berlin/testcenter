#!/bin/bash

source integration/test-init/tests/functions.sh

take_current_version

create_sample_folder ws_1
create_sample_folder ws_2

echo "## Test 3.1: DB is missing, but a data folder is present";
# this scenario happened quite often, when db volume was deleted, but cleaning data dir was forgotten

php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=super_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \

expect_data_dir_equals restored_workspaces
expect_table_to_have_rows workspaces 2

echo "## Test 3.2: Don't create workspace if empty name is given";

php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--overwrite_existing_installation=yes

expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0

