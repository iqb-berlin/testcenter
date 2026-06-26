#!/usr/bin/env bash

declare TARGET_VERSION="18.1.0"

function migrate_env_file() {
  if ! grep -q "^PASSWORD_MIN_LENGTH=" .env.prod; then
    sed -i.bak "/^PASSWORD_SALT=.*/a PASSWORD_MIN_LENGTH=7\nPASSWORD_REGEX_CHECK='/.*/'\nADMIN_INIT_PASSWORD=user123" .env.prod && rm .env.prod.bak
  fi
}

function main() {
  source .env.prod

  printf "    Applying patch: %s ...\n" ${TARGET_VERSION}

  migrate_env_file

  printf "    Patch %s applied.\n" ${TARGET_VERSION}
}

main
