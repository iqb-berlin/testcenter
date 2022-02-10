#!/bin/bash

source integration/test-init/functions/functions.sh

echo_h1 "If DB-Schema is unknown, allow failing on installing patches"

# so already installed patches can be re-installed

fake_patch 7.0.0 "totally not valid sql"
php scripts/initialize.php \
--user_name "" \
--workspace "" \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--skip_db_integrity_check=true
expect_init_script_ok

php scripts/initialize.php \
--workspace "" \
--skip_db_integrity_check=true
expect_init_script_ok

echo_h1 "Fail when bogus patch appears on updates between non-legacy versions"

fake_version 10.0.0
php scripts/initialize.php \
--workspace "" \
--skip_db_integrity_check=true
expect_init_script_ok

fake_patch 10.0.9999 "totally not valid SQL"
fake_version 11.0.0
php scripts/initialize.php \
--workspace "" \
--skip_db_integrity_check=true
expect_init_script_failed


echo_h1 "Test 4.3: Skip future patch versions"

fake_version 10.0.9999
fake_patch 1000.0.0 "insert into meta (metaKey, value) VALUES ('i should', 'never be applied');"
fake_patch 10.0.9998 "insert into meta (metaKey, value) VALUES ('but me,', 'i have to be there');"
fake_patch 10.0.9999 "insert into meta (metaKey, value) VALUES ('and me', 'too');"

php scripts/initialize.php \
--user_name "" \
--workspace "" \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--overwrite_existing_installation=true \
--skip_db_integrity_check=true # to maintain test's compatibility with future versions

expect_init_script_ok
expect_table_to_have_rows meta 3 # namely "version", "but me," and "and me"
