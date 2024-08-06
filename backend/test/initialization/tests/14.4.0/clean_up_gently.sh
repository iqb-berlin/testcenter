#!/bin/bash

source backend/test/initialization/functions/functions.sh

echo_h1 "14.4.0 cleaned up the database and deleted duplicate sessions which could be created by an earlier bug.";
fake_version 14.3.0
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

echo_h2 "Create some data"
php backend/test/massive-test-data.php \
  --workspaces=1 \
  --ttfiles_per_workspace=1 \
  --groups_per_ttfile=1 \
  --logins_per_group=2 \
  --codes_per_login=2 \
  --start_test_probability=0 \
  --lock_test_probability=0 \
  --restart_logins_per_group=1 \
  --session_per_restart_login=4 \
  --duplicate_login_sessions_per_restart_login=2 \
  --duplicate_person_sessions_per_restart_login=1
expect_table_to_have_rows login_sessions 7 # = 2 * 2 (return logins) + 1 (restart login) + 2 (duplicates)
expect_table_to_have_rows person_sessions 8 # = 2 * 2 (return logins) + 1 (restart login) * 4 (times restarted)
expect_table_to_have_rows tests 24
expect_sql_to_return "select count(distinct name_suffix) from person_sessions" "[[5]]"

echo_h2 "Do the patch and don't delete data"
fake_version 14.4.0
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
expect_table_to_have_rows login_sessions 3 # same logins, different code = 1 logins, restart-duplicates removed as well
expect_table_to_have_rows person_sessions 8 # = 2 * 2 (return logins) + 1 (restart login) * 4 (times restarted)
expect_table_to_have_rows tests 24
expect_sql_to_return "select count(distinct name_suffix) from person_sessions" "[[6]]"