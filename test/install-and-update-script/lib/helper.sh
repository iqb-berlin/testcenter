#!/bin/bash

function before_all() {
  chmod +x /test/lib/mock-docker.sh
  ln -s /test/lib/mock-docker.sh /bin/docker
  ln -s /test/lib/mock-make.sh /bin/make
}

function before_each() {
  if [ -d "/dist" ]; then
    rm -rf /dist
  fi;

  mkdir /dist
}

# param 1: path expectation
function expect_dir_equals() {
  result=$(cd "$1" && find . -not -path '*/.*' | sort | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/")
  differences=$(diff <(echo "$result") <(echo "$2"))
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

# param 1: file expectation
function expect_file_equals() {
  differences=$(diff "$1" <(echo "$2"))
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

# compares vars in envs
# by chatGPT
# param 1: .env file 1
# param 1: .env file 2
function compare_envs() {
  # Extract variable names from the .env files, sort them, and store in temporary files
  grep -o '^[^#]*=' "$1" | cut -d= -f1 | sort > /tmp/env1_vars_sorted
  grep -o '^[^#]*=' "$2" | cut -d= -f1 | sort > /tmp/env2_vars_sorted

  # Compare the sorted lists of variables
  diff /tmp/env1_vars_sorted /tmp/env2_vars_sorted
  diff_exit_code=$?

  # Check the return code and print appropriate messages
  if [ $diff_exit_code -eq 0 ]; then
      echo "The .env files contain the same variables."
  elif [ $diff_exit_code -eq 1 ]; then
      echo "The .env files contain different variables."
  else
      echo "An error occurred while comparing the .env files."
  fi

  # Clean up temporary files
  rm /tmp/env1_vars_sorted /tmp/env2_vars_sorted
}

