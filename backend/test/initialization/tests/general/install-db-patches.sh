#!/bin/bash

source backend/test/initialization/functions/functions.sh

echo_h1 "If DB-Schema is unknown, allow failing on installing patches"

# so already installed patches can be re-installed

fake_patch 7.0.0 "totally not valid sql"

#tail -f /dev/null

php backend/initialize.php \
  --skip_db_integrity_check # to maintain test's compatibility with future versions
expect_init_script_ok

php backend/initialize.php \
  --dont_create_sample_data \
  --skip_db_integrity_check
expect_init_script_ok

echo_h1 "Fail when bogus patch appears on updates between non-legacy versions"

fake_version 10.0.0
php backend/initialize.php \
  --dont_create_sample_data \
  --skip_db_integrity_check
expect_init_script_ok

fake_patch 10.0.9999 "totally not valid SQL"
fake_version 11.0.0
php backend/initialize.php \
  --dont_create_sample_data \
  --skip_db_integrity_check
expect_init_script_failed
remove_error_lock


echo_h1 "Skip future patch versions"

fake_version 10.0.9999
fake_patch 1000.0.0 "insert into meta (metaKey, value) VALUES ('i should', 'never be applied');"
fake_patch 10.0.9998 "insert into meta (metaKey, value) VALUES ('but me,', 'i have to be there');"
fake_patch 10.0.9999 "insert into meta (metaKey, value) VALUES ('and me', 'too');"

php backend/initialize.php \
  --dont_create_sample_data \
  --skip_db_integrity_check

expect_init_script_ok

expect_table_to_have_rows meta 3 # namely "version", "but me," and "and me"
