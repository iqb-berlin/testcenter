#!/usr/bin/env bash

# db connection
DBConnectionDataFile=/var/www/html/config/DBConnectionData.json
if [ ! -f "$DBConnectionDataFile" ]; then
  touch $DBConnectionDataFile
  echo "{\"type\": \"mysql\", \"host\": \"${MYSQL_HOST}\", \"port\": \"${MYSQL_PORT}\", \"dbname\": \"${MYSQL_DATABASE}\", \"user\": \"${MYSQL_USER}\", \"password\": \"${MYSQL_PASSWORD}\"}" > $DBConnectionDataFile
fi

# init data
php /var/www/html/scripts/initialize.php \
  --user_name=$SUPERUSER_NAME \
  --user_password=$SUPERUSER_PASSWORD \
  --workspace=$WORKSPACE_NAME \
  --test_login_name=$TEST_LOGIN_NAME \
  --test_login_password=$TEST_LOGIN_PASSWORD \
  --test_person_codes="xxx yyy" \
  --broadcast_service_uri=$BROADCAST_SERVICE_URI

# file-rights
chown -R www-data:www-data /var/www/html/vo_data

# keep container open
apache2-foreground
