#!/bin/bash

# param 1: headline text
function echo_h1() {
  printf "\033[1;36;40m$1\033[0m\n"
}

# param 1: headline text
function echo_h2() {
  printf "\033[0;30;46m$1\033[0m\n"
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
  cp package.original.json package.json
  sed -i -r "s|\"version\":[[:space:]]*\"([a-z0-9\.\-]*)\"|\"version\": \"$1\"|" package.json
}

function take_current_version() {
  cp package.original.json package.json
}


# param 1: expectation file name
function expect_db_structure_dump_equals() {
  result=$(php backend/test/initialization/functions/structure.php)
  expectation_file="backend/test/initialization/expectations/$1.yml"
  differences=$(diff <(echo "$result") "$expectation_file")
  if [ "$differences" != "" ]
  then
    echo_fail "Expectation '$1' failed: "
    echo "$differences";
    exit 1
  else
    echo_success "Expectation '$1' met"
  fi
}

# param 1: table
# param 2: count
function expect_table_to_have_rows() {
  result=$(php backend/test/initialization/functions/count.php --table="$1")
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
  result=$(cd data && find . -not -path '*/.*' | sort | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/")
  expectation_file="backend/test/initialization/expectations/$1"
  differences=$(diff <(echo "$result") "$expectation_file")
  if [ "$differences" != "" ]
  then
    echo "$result"
    echo_fail "Expectation '$1' failed"
    echo "$differences"
    exit 1
  else
    echo_success "Expectation '$1' met"
  fi
}

# param 1: expectation
# param 1: result
function expect_equals() {
  differences=$(diff <(echo "$1") <(echo "$2"))
  if [ "$differences" != "" ]
  then
    echo "$result"
    echo_fail "Expectation '$1' failed"
    echo "$differences"
    exit 1
  else
    echo_success "Expectation '$1' met"
  fi
}

# param 1: sql
# param 2: expected output
function expect_sql_to_return() {
  result=$(echo "$1" | run sql)
  differences=$(diff <(echo "$result") <(echo "$2"))
  if [ "$differences" != "" ]
  then
    echo_fail "Expectation Failed:"
    echo "Query: $1"
    echo "$differences"
    exit 1
  else
    echo_success "Expected '$2': OK"
  fi
}


function expect_init_script_ok() {
  errorCode=$?
  if [ "$errorCode" == 1 ] ;then
    echo_fail "Init-Script failed unexpectedly"
    exit 1
  fi;
  echo_success "Init-Script succeeded as expected"
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
  mkdir -p "data"
  mkdir "data/$1"
  mkdir "data/$1/SysCheck"
  cp sampledata/SysCheck.xml "data/$1/SysCheck/"
}


# param 1: patch-version
# param 2: patch-content
function create_fake_patch() {
  echo "$2" > "scripts/database/patches.d/$1.sql"
}

function remove_patch() {
  rm "scripts/database/patches.d/$1.sql"
}

# param 1: workspace-id
function delete_workspace() {
  php backend/test/initialization/functions/delete-workspace.php --ws_id="$1"
}

# param 1: script name
function run() {
  php "backend/test/initialization/functions/$1.php"
}

function remove_error_lock() {
  rm "backend/config/error.lock"
}