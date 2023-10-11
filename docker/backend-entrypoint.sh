#!/usr/bin/env bash

set -e

if [ "$BROADCAST_SERVICE_ENABLED" = "yes" ] || [ "$BROADCAST_SERVICE_ENABLED" = "true" ]
  then
    echo "Broadcast-Service enabled"
    BROADCAST_SERVICE_URI_PUSH=http://testcenter-broadcasting-service:3000
    BROADCAST_SERVICE_URI_SUBSCRIBE=wss://${HOSTNAME}/bs/public
  else
    echo "Broadcast-Service disabled"
fi

# init data
php /var/www/backend/initialize.php \
--user_name=$SUPERUSER_NAME \
--user_password=$SUPERUSER_PASSWORD \
--workspace=sample_workspace \
--host=$MYSQL_HOST \
--port=$MYSQL_PORT \
--dbname=$MYSQL_DATABASE \
--user=$MYSQL_USER \
--password=$MYSQL_PASSWORD \
--broadcastServiceUriPush=$BROADCAST_SERVICE_URI_PUSH \
--broadcastServiceUriSubscribe=$BROADCAST_SERVICE_URI_SUBSCRIBE

# file-rights
chown -R www-data:www-data /var/www/data

# keep container open
apache2-foreground
