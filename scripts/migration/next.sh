#!/usr/bin/env bash

declare TARGET_VERSION="next"

function migrate_env_file() {
  if ! grep -q "^MYSQL_BINLOG_EXPIRE_LOGS_SECONDS=" .env.prod; then
    sed -i.bak '/^MYSQL_PASSWORD=.*/a MYSQL_BINLOG_EXPIRE_LOGS_SECONDS=' .env.prod && rm .env.prod.bak
  fi
}

function main() {
  source .env.prod

  printf "    Applying patch: %s ...\n" ${TARGET_VERSION}

  migrate_env_file

  printf "    Patch %s applied.\n" ${TARGET_VERSION}
}

main
