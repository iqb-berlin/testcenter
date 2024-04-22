#!/bin/bash

source backend/test/initialization/functions/functions.sh


php backend/initialize.php

expect_init_script_ok
expect_data_dir_equals sample_content_present
expect_table_to_have_rows files 10
expect_table_to_have_rows logins 13

echo_h2 "Delete a testtakers-file manually and sync the DB when initializing again"

unlink data/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML

php backend/initialize.php

expect_init_script_ok
expect_table_to_have_rows files 9
expect_table_to_have_rows logins 0

echo "test mein script"
expect_sql_to_return "select * from workspaces" '[[1,"Sample Workspace","984b2490"]]'
out=$(php backend/initialize.php)
if "$out" | grep -q "Change in files detected. Stored"; then
    echo "is right"
else
  echo "is wrong"
fi

echo "UPDATE workspaces SET workspace_hash = '1234' WHERE id = 1" | run sql
expect_sql_to_return "select * from workspaces" '[[1,"Sample Workspace","1234"]]'
out=$(php backend/initialize.php)
if "$out" | grep -q "Change in files detected. Stored"; then
    echo "is right"
else
  echo "is wrong"
fi

