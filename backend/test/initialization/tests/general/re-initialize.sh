#!/bin/bash
source backend/test/initialization/functions/functions.sh

(
  echo_h1 "New installation of current Version";

  create_patch 7.0.0 "totally not valid sql"
  create_patch 10.0.9998 "insert into meta (metaKey, value) VALUES ('but me,', 'i have to be there');"
  create_patch 10.0.9999 "insert into meta (metaKey, value) VALUES ('and me', 'too');"

  take_current_version

  php backend/initialize.php

  expect_init_script_ok
  expect_data_dir_equals sample_content_present
  expect_table_to_have_rows files 10
  expect_table_to_have_rows logins 15

  echo_h2 "Delete a testtakers-file manually and sync the DB when initializing again. Files should be re-imported"

  unlink data/ws_1/Testtakers/SAMPLE_TESTTAKERS.XML

  output=$(php backend/initialize.php)

  expect_init_script_ok
  expect_table_to_have_rows files 9
  expect_table_to_have_rows logins 0

  if echo "$output" | grep -qi "files were stored"; then
      echo "files were re-imported"
  else
    echo "files were not re-imported "
  fi


  echo_h2 "Leave files as be. Files should NOT be re-imported"

  output2=$(php backend/initialize.php)

  expect_init_script_ok
  expect_table_to_have_rows files 9
  expect_table_to_have_rows logins 0

  if echo "$output2" | grep -qi "files were stored"; then
      echo "files were re-imported"
  else
    echo "files were not re-imported "
  fi
)
# wrap all in subshell to catch error returns and clean up afterwards
EXITCODE=$?
remove_patch 7.0.0
remove_patch 10.0.9998
remove_patch 10.0.9999
exit "$EXITCODE"