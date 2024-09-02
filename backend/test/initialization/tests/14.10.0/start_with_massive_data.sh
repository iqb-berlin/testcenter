#!/bin/bash

source backend/test/initialization/functions/functions.sh

echo_h1 "The StartUp Process should not take so long even if database is full";

echo_h2 "Install";
php backend/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=new_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD
expect_init_script_ok

echo_h2 "Create massive data"
php backend/test/massive-test-data.php \
--workspaces=10 \
--ttfiles_per_workspace=3 \
--codes_per_login=30 \
--start_test_probability=0 \
--lock_test_probability=0


echo_h2 "Run Init-Script Again and see how long it takes";
timeout --kill-after=1 10m \
php backend/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=new_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD
expect_init_script_ok