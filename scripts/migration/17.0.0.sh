#!/bin/bash

function check_version_gt_15.3.4() {
  declare prerelease_regex="^(0|([1-9][0-9]*))\.(0|([1-9][0-9]*))\.(0|([1-9][0-9]*))(-((alpha|beta|rc)((\.)?([1-9][0-9]*))?))$"
  declare release_regex="^((0|([1-9][0-9]*)))\.((0|([1-9][0-9]*)))\.((0|([1-9][0-9]*)))$"

  if ! [[ "$VERSION" =~ $prerelease_regex || "$VERSION" =~ $release_regex ]]; then
    return 1
  else
    declare normalized_version="$VERSION"

    if [[ "$VERSION" =~ $prerelease_regex ]]; then
      normalized_version=$(printf '%s' "$VERSION" | cut -d'-' -f1)
    fi

    # Check VERSION is less or equal than 15.3.4
    if printf '%s\n%s' "$normalized_version" 15.3.4 | sort -C -V; then
      return 1
    else
      return 0
    fi
  fi
}

function migrate_env_file() {
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

function main() {
  declare target_version="16.0.0"

  printf "Applying patch: %s ...\n" ${target_version}

  if check_version_gt_15.3.4; then

    # Migrate docker environment file
    migrate_env_file

    printf "Patch %s applied.\n" ${target_version}
  else
    printf "Patch %s skipped.\n" ${target_version}
  fi
}

source .env.prod

if [ -n "${1}" ]; then
  VERSION=${1}
fi

main
