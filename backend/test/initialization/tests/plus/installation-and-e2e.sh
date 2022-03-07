#!/bin/bash

source backend/test/initialization/functions/functions.sh

echo_h1 "Blank installation of current Version";
take_current_version
php backend/initialize.php \
--user_name=super \
--user_password=user123 \
--workspace=a_beautiful_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD
expect_init_script_ok
expect_data_dir_equals sample_content_present
expect_table_to_have_rows workspaces 1
expect_table_to_have_rows users 1

echo_h2 "Run E2e-Tests"
service apache2 start
cd /var/www/html || exit
cp config/DBConnectionData.json config/DBConnectionData.mysql.json
echo "{\"configFile\":\"mysql\"}" > config/e2eTests.json
chmod -R 777 data
ALLOW_REAL_DATA_MODE=yes npm --prefix=integration run dredd_test_no_specs
service apache2 stop
