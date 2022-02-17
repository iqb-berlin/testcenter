#!/bin/bash

source integration/test-init/functions/functions.sh

take_current_version

create_sample_folder ws_1
create_sample_folder ws_2

echo_h1 "Test 3.1: DB is missing, but a data folder is present";
# this scenario happened quite often, when db volume was deleted, but cleaning data dir was forgotten

php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=new_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \

expect_init_script_ok
expect_data_dir_equals restored_workspaces
expect_table_to_have_rows workspaces 2


echo_h1 "Test 3.2: Don't restore deleted workspace";
# eg after restart of container

delete_workspace 2

php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=new_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \

expect_init_script_ok
expect_table_to_have_rows workspaces 1


echo_h1 "Test 3.3: Don't create workspace or admin if empty names are given";

php scripts/initialize.php \
--user_name "" \
--workspace "" \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--overwrite_existing_installation=yes

expect_init_script_ok
expect_data_dir_equals empty_data_dir
expect_table_to_have_rows workspaces 0

