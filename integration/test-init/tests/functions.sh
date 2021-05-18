#!/bin/bash

# param 1: version to fake
function fake_version() {
  cp composer.json.original composer.json
  sed -i -r "s|\"version\":[[:space:]]*\"([a-z0-9\.\-]*)\"|\"version\": \"$1\"|" composer.json
}

function take_current_version() {
  cp composer.json.original composer.json
}


# param 1: expectation file name
function expect_db_structure_dump_equals() {
  result=$(php integration/test-init/db-dump/structure.php)
  expectation_file="integration/test-init/expectations/$1.yml"
  differences=$(diff <(echo "$result") "$expectation_file")
  if [ "$differences" != "" ]
  then
    echo "Expectation '$1' failed: "
    echo "$result";
    exit 1
  else
    echo "Expectation '$1' met"
  fi
}

# param 1: table
# param 2: count
function expect_table_to_have_rows() {
  result=$(php integration/test-init/db-dump/count.php --table="$1")
  if [ "$2" != "$result" ]
  then
    echo "Expected $1 to have $2 rows, but has $result."
    exit 1
  else
    echo "Expectation met: $1 has $result rows."
  fi
}

# param 1: expectation file name
function expect_data_dir_equals() {
  result=$(cd vo_data && find . | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/")
  expectation_file="integration/test-init/expectations/$1"
  differences=$(diff <(echo "$result") "$expectation_file")
  if [ "$differences" != "" ]
  then
    echo "Expectation '$1' failed: $differences"
    exit 1
  else
    echo "Expectation '$1' met"
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
