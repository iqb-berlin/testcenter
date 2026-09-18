#!/usr/bin/env bash

# The mirror case of no-db-but-files.sh: the database is there, the data directory is not.
# That is what a restore looks like between its two halves, and what a lost data volume leaves behind.

source backend/test/initialization/functions/functions.sh

take_current_version

echo_h1 "Test 5.1: Prepare a populated installation";

php backend/initialize.php

expect_init_script_ok
expect_table_to_have_rows workspaces 1

files_before=$(count_rows files)
logins_before=$(count_rows logins)
echo "files: $files_before, logins: $logins_before"


echo_h1 "Test 5.2: A database without a data directory starts up";

rm -rf data/ws_1

php backend/initialize.php

expect_init_script_ok
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows files "$files_before"
expect_table_to_have_rows logins "$logins_before"


echo_h1 "Test 5.3: An empty workspace folder does not empty the database";
# any request touching the workspace creates its folder (Workspace::getOrCreateWorkspacePath), so the next start
# finds an empty one

mkdir -p data/ws_1

php backend/initialize.php

expect_init_script_ok
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows files "$files_before"
expect_table_to_have_rows logins "$logins_before"


echo_h1 "Test 5.4: Pruning still works once the folder holds content again";

mkdir -p data/ws_1/SysCheck
cp sampledata/SysCheck.xml data/ws_1/SysCheck/

php backend/initialize.php

expect_init_script_ok
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows files 1
expect_table_to_have_rows logins 0
