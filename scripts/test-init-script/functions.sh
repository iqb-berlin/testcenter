#!/bin/bash

# param 1: version to fake
function fake_version() {
  cp /var/www/html/composer.json.original /var/www/html/composer.json
  sed -i -r "s|\"version\":[[:space:]]*\"([a-z0-9\.\-]*)\"|\"version\": \"$1\"|" composer.json
}


# param 1: dump file name
function expect_dump_equals() {
  result=`php /var/www/html/scripts/system-dump.php`
  expectation_file="/var/www/html/scripts/test-init-script/$1.yml"
  differences=$(diff <(echo "$result") "$expectation_file")
  if [ "$differences" != "" ]
  then
    echo "Expectation '$1' failed: $differences"
    exit 1
  else
    echo "Expectation '$1' matched"
  fi
}

function expect_init_script_ok() {
  errorCode=$?
  if [ "$errorCode" == 1 ] ;then
    echo "Init-Script failed!"
    exit 1
  fi;
}

function expect_init_script_failed() {
  errorCode=$?
  if [ "$errorCode" != 1 ] ;then
    echo "Init-Script did not failed as expected"
    exit 1
  fi;
  echo "Init-Script failed as expected"
}
