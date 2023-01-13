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

chown -R www-data:www-data /var/www/data

echo_h2 "Run Server"
service apache2 start

echo_h2 "Login"

LOGIN_RESULT=$(
  curl --location --silent --fail --show-error \
    --request PUT "http://localhost/session/admin" \
    --data-raw '{"name":"super","password":"user123"}'
)

AUTH_TOKEN=$(echo $LOGIN_RESULT | jq -r ".token")

echo_success "Logged in. Token: $AUTH_TOKEN"


echo_h2 "Insert additional Testdata"

echo '<html><head><meta name="application-name" content="dummy-player" data-version="1.1.1"/></head></html>' > verona-player-dummy-1.1.1.html
echo '<Unit><Metadata><Id>dummy</Id><Label>-</Label></Metadata><Definition player="verona-player-dummy-1.1.1">-</Definition></Unit>' > dummy-unit.xml

curl --location --silent --fail --show-error \
  --request POST 'http://localhost/workspace/1/file' \
  --header "AuthToken: $AUTH_TOKEN" \
  --form 'fileforvo=@"/var/www/verona-player-dummy-1.1.1.html"'

curl --location --silent --fail --show-error \
  --request POST 'http://localhost/workspace/1/file' \
  --header "AuthToken: $AUTH_TOKEN" \
  --form 'fileforvo=@"/var/www/dummy-unit.xml"'



#echo_h1 "Test various scenarios of uploading changed files"
#
#echo_h2 "Unit would break by upload a new mayor with the same filename"
#
#echo '<html><head><meta name="application-name" content="dummy-player" data-version="2.0.0"/></head></html>' > verona-player-dummy-1.1.1.html
#
#curl --location --silent --fail --show-error \
#  --request POST 'http://localhost/workspace/1/file' \
#  --header "AuthToken: $AUTH_TOKEN" \
#  --form 'fileforvo=@"/var/www/verona-player-dummy-1.1.1.html"'