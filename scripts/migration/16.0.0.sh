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
  sed -i.bak "s|^CACHE_SERVICE_INCLUDE_FILES=|REDIS_CACHE_FILES=|" .env.prod && rm .env.prod.bak
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
