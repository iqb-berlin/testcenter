#!/bin/bash

# param 1: headline text
function echo_h1() {
  printf "\033[0;36;40m$1\033[0m\n"
}

# param 1: success text
function echo_success() {
  printf "\033[0;30;42m$1\033[0m\n"
}

# param 1: fail text
function echo_fail() {
  printf "\033[0;30;41m$1\033[0m\n"
}

# param 1: version to fake
function fake_version() {
  cp composer.original.json composer.json
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
    echo_fail "Expectation '$1' failed: "
    echo "$result";
    exit 1
  else
    echo_success "Expectation '$1' met"
  fi
}

# param 1: table
# param 2: count
function expect_table_to_have_rows() {
  result=$(php integration/test-init/db-dump/count.php --table="$1")
  if [ "$2" != "$result" ]
  then
    echo_fail "Expected $1 to have $2 rows, but has $result."
    exit 1
  else
    echo_success "Expectation met: $1 has $result rows."
  fi
}

# param 1: expectation file name
function expect_data_dir_equals() {
  result=$(cd vo_data && find . | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/")
  expectation_file="integration/test-init/expectations/$1"
  differences=$(diff <(echo "$result") "$expectation_file")
  if [ "$differences" != "" ]
  then
    echo_fail "Expectation '$1' failed: $differences"
    exit 1
  else
    echo_success "Expectation '$1' met"
  fi
}

function expect_init_script_ok() {
  errorCode=$?
  if [ "$errorCode" == 1 ] ;then
    echo_fail "Init-Script failed!"
    exit 1
  fi;
}

function expect_init_script_failed() {
  errorCode=$?
  if [ "$errorCode" != 1 ] ;then
    echo_fail "Init-Script did not failed as expected"
    exit 1
  fi;
  echo_success "Init-Script failed as expected"
}

# param 1: expectation folder name
function create_sample_folder() {
  mkdir -p "vo_data"
  mkdir "vo_data/$1"
  mkdir "vo_data/$1/SysCheck"
  cp sampledata/SysCheck.xml "vo_data/$1/SysCheck/"
}


# param 1: patch-version
# param 2: patch-content
function fake_patch() {
  echo "$2" > "scripts/sql-schema/mysql.patches.d/$1.sql"
}

# param 1: workspace-id
function delete_workspace() {
  php integration/test-init/db-dump/delete-workspace.php --ws_id="$1"
}
