#!/bin/bash

source integration/test-init/functions/functions.sh

echo_h1 "Test: Test the crucial patch from 12.0.2 to 13.1.0";

fake_version "12.0.2"
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
#expect_db_structure_dump_equals blank_legacy_version_7


echo "INSERT INTO login_sessions (name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name, custom_texts) VALUES ('test', 'run-hot-return', 1, null, 'a61dedf1e041e00.13152208', '', 'sample_group', '');" | run sql
echo "INSERT INTO login_sessions (name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name, custom_texts) VALUES ('hotres', 'run-hot-restart', 1, null, 'a61dedf1e041e00.13152208', '', 'hotres', '{}');" | run sql
echo "INSERT INTO login_sessions (name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name, custom_texts) VALUES ('hotres', 'run-hot-restart', 1, null, 'a61dedf1e041e00.13152208', '', 'hotres', '{}');" | run sql

echo "INSERT INTO person_sessions (code, login_id, valid_until, token, laststate) VALUES ('xxx', 1, null, 'a61dedf1e041e00.13152208', null);" | run sql
echo "INSERT INTO person_sessions (code, login_id, valid_until, token, laststate) VALUES ('', 12, null, 'a61dedf1e041e00.13152208', null);" | run sql
echo "INSERT INTO person_sessions (code, login_id, valid_until, token, laststate) VALUES ('', 13, null, 'a61dedf1e041e00.13152208', null);" | run sql

# more script/sql-schema/mysql.patches.d/13.0.0.sql