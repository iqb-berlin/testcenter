#!/bin/bash

source integration/test-init/tests/functions.sh

echo_h1 "Patch 12.0.0 might break, should 12.0.2 fix it"

# so already installed patches can be re-installed

fake_version 11.0.0
php scripts/initialize.php \
--user_name "" \
--workspace "workspace" \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--skip_db_integrity_check=true
expect_init_script_ok


echo "INSERT INTO login_sessions (name, mode, workspace_id, token, group_name) VALUES ('l', 'run-hot-return', 1, 't', 'sample_group');" | run sql
echo "INSERT INTO person_sessions (login_id, code, token) VALUES (1, 'd', 't');" | run sql
echo "INSERT INTO tests (id, name, person_id) VALUES (1, 'sample test', 1);" | run sql
echo "INSERT INTO units (name, booklet_id, laststate, responses, responsetype, responses_ts, restorepoint, restorepoint_ts) VALUES ('UNIT_1', 1, 'state', 'responses', '', 1597903000, '\"restore point\"', 1597903000);" | run sql

# add the problematic one:
echo "INSERT INTO units (name, booklet_id, laststate, responses, responsetype, responses_ts, restorepoint, restorepoint_ts) VALUES ('UNIT_2', 1, 'state', null, '', 1597903000, '\"restore point\"', 1597903000);" | run sql


fake_version 12.0.0
php scripts/initialize.php \
--user_name "" \
--workspace "" \
--skip_db_integrity_check=true # to maintain test's compatibility with future versions
expect_init_script_failed

fake_version 12.0.2
php scripts/initialize.php \
--user_name "" \
--workspace "" \
--skip_db_integrity_check=true # to maintain test's compatibility with future versions
expect_init_script_ok
