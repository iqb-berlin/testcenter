#!/usr/bin/env bash

source backend/test/initialization/functions/functions.sh

echo_h1 "The patch 12.0.0 was unstable and might break on some data. The replacing Patch 12.0.2 should not cause any trouble even if the original 12.0.0 had no problems.";

echo_h2 "Install Version 11";
fake_version 11.0.0
php backend/initialize.php \
--skip_read_workspace_files \
--skip_db_integrity_check
expect_init_script_ok


echo_h2 "add some data";
echo "INSERT INTO login_sessions (name, mode, workspace_id, token, group_name) VALUES ('l', 'run-hot-return', 1, 't', 'sample_group');" | run sql
echo "INSERT INTO person_sessions (login_id, code, token) VALUES (1, 'd', 't');" | run sql
echo "INSERT INTO tests (id, name, person_id) VALUES (1, 'sample test', 1);" | run sql
echo "INSERT INTO units (name, booklet_id, laststate, responses, responsetype, responses_ts, restorepoint, restorepoint_ts) VALUES ('UNIT_1', 1, 'state', 'old responses', '', 1597903000, '\"restore point\"', 1597903000);" | run sql
echo "INSERT INTO units (name, booklet_id, laststate, responses, responsetype, responses_ts, restorepoint, restorepoint_ts) VALUES ('UNIT_2', 1, 'state', 'old responses', '', 1597903000, '\"restore point\"', 1597903000);" | run sql


echo_h2 "The bogus patch should work, because there is no problematic data";
fake_version 12.0.0
cp backend/test/initialization/data/broken-12.0.0-patch.sql scripts/database/patches.d/12.0.0.sql
php backend/initialize.php \
--dont_create_sample_data \
--skip_read_workspace_files \
--skip_db_integrity_check
expect_init_script_ok
expect_table_to_have_rows unit_data 2
expect_table_to_have_rows units 2
expect_sql_to_return "select column_name from information_schema.columns WHERE table_name='units'" '[["id"],["name"],["booklet_id"],["laststate"]]'
expect_sql_to_return "select content from unit_data order by unit_id" '[["old responses"],["old responses"]]'
rm scripts/database/patches.d/12.0.0.sql


echo_h2 "Assume further usage of the testcenter"
# a new unit
echo "INSERT INTO units (name, booklet_id, laststate) VALUES ('UNIT_NEW', 1, 'state');" | run sql
echo "INSERT INTO unit_data (unit_id, part_id, content, ts, response_type) VALUES (3, 'partA', 'contentA', 123456789, 'text');" | run sql
echo "INSERT INTO unit_data (unit_id, part_id, content, ts, response_type) VALUES (3, 'partB', 'contentB', 123456789, 'text');" | run sql
# an update to an old one
echo "REPLACE INTO unit_data (unit_id, part_id, content, ts, response_type) VALUES (1, 'all', 'new responses', 123456789, 'text');" | run sql
expect_table_to_have_rows unit_data 4
expect_table_to_have_rows units 3
expect_sql_to_return "select content from unit_data order by unit_id" '[["new responses"],["old responses"],["contentA"],["contentB"]]'


echo_h2 "Running the update containing the revised patch should not affect the data";
fake_version 12.0.2
php backend/initialize.php \
--dont_create_sample_data \
--skip_read_workspace_files \
--skip_db_integrity_check
expect_init_script_ok
expect_table_to_have_rows unit_data 4
expect_table_to_have_rows units 3
expect_sql_to_return "select content from unit_data order by unit_id" '[["new responses"],["old responses"],["contentA"],["contentB"]]'