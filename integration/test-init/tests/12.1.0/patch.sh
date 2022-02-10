#!/bin/bash

source integration/test-init/functions/functions.sh

echo_h1 "Test: Test the crucial patch from 12 to 13.0.0";

fake_version "12.0.0"
php scripts/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=new_workspace \
--skip_db_integrity_check=true
expect_init_script_ok
#expect_db_structure_dump_equals blank_legacy_version_7


echo "INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name, custom_texts) VALUES (1, 'test', 'run-hot-return', 6, null, 'a61dedf1e041e00.13152208', '', 'sample_group', '');" | run sql
echo "INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name, custom_texts) VALUES (12, 'hotres', 'run-hot-restart', 1, null, 'a61dedf1e041e00.13152208', '', 'hotres', '{}');" | run sql
echo "INSERT INTO login_sessions (id, name, mode, workspace_id, valid_until, token, codes_to_booklets, group_name, custom_texts) VALUES (13, 'hotres', 'run-hot-restart', 1, null, 'a61dedf1e041e00.13152208', '', 'hotres', '{}');" | run sql

echo "INSERT INTO person_sessions (id, code, login_id, valid_until, token, laststate) VALUES (1, 'xxx', 1, null, 'a61dedf1e041e00.13152208', null);" | run sql
echo "INSERT INTO person_sessions (id, code, login_id, valid_until, token, laststate) VALUES (12, '', 12, null, 'a61dedf1e041e00.13152208', null);" | run sql
echo "INSERT INTO person_sessions (id, code, login_id, valid_until, token, laststate) VALUES (13, '', 13, null, 'a61dedf1e041e00.13152208', null);" | run sql

# more script/sql-schema/mysql.patches.d/13.0.0.sql