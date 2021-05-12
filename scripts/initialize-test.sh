#!/bin/bash
# Script to test initializer test

source /var/www/html/scripts/test-init-script/functions.sh

# preparation
#chown -R www-data:www-data /var/www/html/vo_data
chmod +x /var/www/html/scripts/system-dump.php

echo "# Testing the Init-script";


TEST_SCENARIO_NR=1
bash "/var/www/html/scripts/test-init-script/scenario_$TEST_SCENARIO_NR.sh"





#result=`ssh testcenter-db-backend-init-test:3306 mysql --user=$MYSQL_USER --password=$MYSQL_PASSWORD $MYSQL_DATABASE -e -s -n "show tables"`;
#echo $result;
