#!/usr/bin/env bash

source backend/test/initialization/functions/functions.sh

(
  echo_h1 "Skip patches older than the schema"

  # full.sql already contains them, so they must not run again

  create_patch 7.0.0 "totally not valid sql"

  php backend/initialize.php \
    --skip_db_integrity_check # to maintain test's compatibility with future versions
  expect_init_script_ok

  php backend/initialize.php \
    --dont_create_sample_data \
    --skip_db_integrity_check
  expect_init_script_ok

  echo_h1 "Fail when a patch newer than the schema is broken"

  set_db_schema_version 10.0.0
  create_patch 10.0.9999 "totally not valid SQL"
  fake_version 11.0.0
  php backend/initialize.php \
    --dont_create_sample_data \
    --skip_db_integrity_check
  expect_init_script_failed
  remove_error_lock


  echo_h1 "Skip future patch versions"

  fake_version 10.0.9999
  create_patch 1000.0.0 "insert into meta (\"metaKey\", value) VALUES ('i should', 'never be applied');"
  create_patch 10.0.9998 "insert into meta (\"metaKey\", value) VALUES ('but me,', 'i have to be there');"
  create_patch 10.0.9999 "insert into meta (\"metaKey\", value) VALUES ('and me', 'too');"

  php backend/initialize.php \
    --dont_create_sample_data \
    --skip_db_integrity_check

  expect_init_script_ok

  expect_table_to_have_rows meta 3 # namely "version", "but me," and "and me"


  echo_h1 "The schema version names the newest applied patch, not the application version"

  # Nothing is left to apply here: 7.0.0 and both 10.0.999x patches are in, and 1000.0.0 is still a
  # future version even at 99.0.0. So the stamp keeps the 10.0.9999 the previous step reached,
  # however far the application version moves away from it.

  fake_version 99.0.0

  php backend/initialize.php \
    --dont_create_sample_data \
    --skip_db_integrity_check

  expect_init_script_ok

  expect_sql_to_return \
    "select value from meta where \"metaKey\" = 'dbSchemaVersion'" \
    '[["10.0.9999"]]'
)
# wrap all in subshell to catch error returns and clean up afterwards
EXITCODE=$?
remove_error_lock
remove_patch 7.0.0
remove_patch 1000.0.0
remove_patch 10.0.9998
remove_patch 10.0.9999
exit "$EXITCODE"
