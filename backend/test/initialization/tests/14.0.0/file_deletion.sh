#!/bin/bash

source backend/test/initialization/functions/functions.sh
take_current_version


echo_h1 "File deletion and it's aftermath";


echo_h2 "Install";
php backend/initialize.php
expect_init_script_ok
chmod -R 777 /var/www/testcenter/data


echo_h2 "start apache"
service apache2 start


echo_h2 "Login"
LOGIN_RESPONSE=$(
  curl --location --silent --show-error \
    --request PUT 'http://localhost/session/admin' \
    --data '{"name":"super","password":"user123"}'
)
REGEX='"token":"([a-zA-Z0-9.-_]+)"'
[[ $LOGIN_RESPONSE =~ $REGEX ]]
TOKEN=${BASH_REMATCH[1]}
echo "Token: $TOKEN"
if [ -z "$TOKEN" ]
then
  echo "Could not find token in response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi


echo_h2 "File data should be correctly stored in DB"
expect_table_to_have_rows files 10
expect_table_to_have_rows logins 13
expect_table_to_have_rows unit_defs_attachments 3


echo_h2 "File with dependencies should not be deletable"
RESPONSE=$(
  curl --location --silent --show-error \
    --request DELETE 'http://localhost/workspace/1/files' \
    --header "AuthToken: $TOKEN" \
    --data '{"f":[
      "Resource/SAMPLE_UNITCONTENTS.HTM",
      "Resource/sample_resource_package.itcr.zip",
      "Resource/verona-player-simple-6.0.html",
      "Unit/SAMPLE_UNIT.XML",
      "Unit/SAMPLE_UNIT2.XML"
    ]}'
)
expect_table_to_have_rows files 10
expect_table_to_have_rows logins 13
expect_table_to_have_rows unit_defs_attachments 3
expect_data_dir_equals sample_content_present
expect_equals '{"deleted":[],"did_not_exist":[],"not_allowed":[],"was_used":["Resource\/SAMPLE_UNITCONTENTS.HTM","Resource\/sample_resource_package.itcr.zip","Resource\/verona-player-simple-6.0.html","Unit\/SAMPLE_UNIT.XML","Unit\/SAMPLE_UNIT2.XML"]}' "$RESPONSE"


echo_h2 "Together with their dependencies they should be deletable"
RESPONSE=$(
  curl --location --silent --show-error \
    --request DELETE 'http://localhost/workspace/1/files' \
    --header "AuthToken: $TOKEN" \
    --data '{"f":[
      "Testtakers/SAMPLE_TESTTAKERS.XML",
      "Booklet/SAMPLE_BOOKLET.XML",
      "Booklet/SAMPLE_BOOKLET2.XML",
      "Booklet/SAMPLE_BOOKLET3.XML",
      "Resource/SAMPLE_UNITCONTENTS.HTM",
      "Resource/sample_resource_package.itcr.zip",
      "Resource/verona-player-simple-6.0.html",
      "SysCheck/SAMPLE_SYSCHECK.XML",
      "Testtakers/SAMPLE_TESTTAKERS.XML",
      "Unit/SAMPLE_UNIT.XML",
      "Unit/SAMPLE_UNIT2.XML"
    ]}'
)
expect_table_to_have_rows files 0
expect_table_to_have_rows logins 0
expect_table_to_have_rows unit_defs_attachments 0
expect_data_dir_equals cleared_data_dir
expect_equals '{"deleted":["Testtakers\/SAMPLE_TESTTAKERS.XML","Booklet\/SAMPLE_BOOKLET.XML","Booklet\/SAMPLE_BOOKLET2.XML","Booklet\/SAMPLE_BOOKLET3.XML","Resource\/SAMPLE_UNITCONTENTS.HTM","Resource\/sample_resource_package.itcr.zip","Resource\/verona-player-simple-6.0.html","SysCheck\/SAMPLE_SYSCHECK.XML","Unit\/SAMPLE_UNIT.XML","Unit\/SAMPLE_UNIT2.XML"],"did_not_exist":["Testtakers\/SAMPLE_TESTTAKERS.XML"],"not_allowed":[],"was_used":[]}' "$RESPONSE"


echo_h2 "After deletion of workspace every traces of the files should be deleted"
RESPONSE=$(
  curl --location --silent --show-error \
    --request DELETE 'http://localhost/workspaces' \
    --header "AuthToken: $TOKEN" \
    --data '{"ws":[1]}'
)
expect_table_to_have_rows files 0
expect_table_to_have_rows logins 0
expect_table_to_have_rows unit_defs_attachments 0
expect_data_dir_equals empty_data_dir

