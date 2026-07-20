#!/usr/bin/env bash

declare TARGET_VERSION='next'

function migrate_env_file() {
  if ! grep -q '^BRUTE_FORCE_PROTECTION=' .env.prod; then
    sed -i.bak '/^FILE_SERVER_ENABLED=.*/a BRUTE_FORCE_PROTECTION=admin login person' .env.prod && rm .env.prod.bak
  fi

  if ! grep -q '^SERVER_KEY=' .env.prod; then
    sed -i.bak '/^PASSWORD_SALT=.*/a SERVER_KEY=Secret' .env.prod && rm .env.prod.bak
  fi
}

function main() {
  source .env.prod

  printf '    Applying patch: %s ...\n' ${TARGET_VERSION}

  migrate_env_file

  printf '    Patch %s applied.\n' ${TARGET_VERSION}
}

main
