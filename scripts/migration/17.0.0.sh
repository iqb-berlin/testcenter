#!/bin/bash

declare TARGET_VERSION="17.0.0"
declare APP_NAME='testcenter'

migrate_env_file() {
  source .env.prod

  # Move 'Security' Block
  sed -i.bak '/^### Security.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^PASSWORD_SALT=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^FILE_SERVICE_ENABLED=.*/a PASSWORD_SALT=${PASSWORD_SALT}" .env.prod && rm .env.prod.bak

  # Reorder 'Cache Service'
  sed -i.bak "s|^### Cache Service.*|## Cache Service|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^#### Allowed memory.*|### Allowed memory usage for cache in byte. 2147483648 = 2GB. Default is 1GB.|" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "s|^#### Should whole files.*|### Should whole files be cached or only authentication tokens|" \
    .env.prod && rm .env.prod.bak

  # Rename 'Cache Service' environment variables
  sed -i.bak "s|^CACHE_SERVICE_RAM=|REDIS_MEMORY_MAX=|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^CACHE_SERVICE_INCLUDE_FILES=|REDIS_CACHE_FILES=|" .env.prod && rm .env.prod.bak

  # Delete empty line after 'Cache Service' block
  sed -i.bak '/^REDIS_CACHE_FILES=.*/{N;s/\n$//}' .env.prod && rm .env.prod.bak

  # Add Password Authentication for 'Cache Service'
  REDIS_PASSWORD=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
  sed -i.bak "/^## Cache Service/a REDIS_PASSWORD=${REDIS_PASSWORD}" .env.prod && rm .env.prod.bak
}

migrate_make_testcenter_update_cmd() {
  if ! grep -q '.sh -s \$(VERSION)' scripts/make/${APP_NAME}.mk; then
    sed -i.bak "s|scripts/update_${APP_NAME}.sh|scripts/update_${APP_NAME}.sh -s \$(VERSION)|" \
      "${PWD}/scripts/make/${APP_NAME}.mk" && rm "${PWD}/scripts/make/${APP_NAME}.mk.bak"
  fi

  printf "File '%s' patched.\n" "scripts/make/${APP_NAME}.mk"
}

main() {
  printf "Applying patch: %s ...\n" ${TARGET_VERSION}

  # Migrate docker environment file
  migrate_env_file

  # Migrate make command 'testcenter-update'
  migrate_make_testcenter_update_cmd

  printf "Patch %s applied.\n" ${TARGET_VERSION}
}

main
