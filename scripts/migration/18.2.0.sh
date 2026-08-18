#!/usr/bin/env bash

declare TARGET_VERSION='next'

function migrate_env_file() {
  if ! grep -q '^BRUTE_FORCE_PROTECTION=' .env.prod; then
    sed -i.bak '/^FILE_SERVER_ENABLED=.*/a BRUTE_FORCE_PROTECTION=admin login person' .env.prod && rm .env.prod.bak
  fi

  if ! grep -q '^SERVER_KEY=' .env.prod; then
    sed -i.bak '/^PASSWORD_SALT=.*/a SERVER_KEY=Secret' .env.prod && rm .env.prod.bak
  fi

  if ! grep -q '^PASSWORD_MIN_LENGTH=' .env.prod; then
    sed -i.bak '/^SERVER_KEY=.*/a PASSWORD_MIN_LENGTH=7' .env.prod && rm .env.prod.bak
  fi

  if ! grep -q '^PASSWORD_PATTERN=' .env.prod; then
    sed -i.bak '/^PASSWORD_MIN_LENGTH=.*/a PASSWORD_PATTERN=^.*$' .env.prod && rm .env.prod.bak
  fi

  if ! grep -q '^ADMIN_INIT_PASSWORD=' .env.prod; then
    sed -i.bak '/^PASSWORD_PATTERN=.*/a ADMIN_INIT_PASSWORD=user123' .env.prod && rm .env.prod.bak
  fi
}

function main() {
  source .env.prod

  printf '    Applying patch: %s ...\n' ${TARGET_VERSION}

  migrate_env_file

  printf '    Patch %s applied.\n' ${TARGET_VERSION}
}

main
