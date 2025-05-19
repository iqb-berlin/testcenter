#!/bin/bash

declare TARGET_VERSION="17.0.0"
declare APP_NAME='testcenter'

migrate_make_studio_update() {
  if ! grep -q '.sh -s \$(VERSION)' scripts/make/${APP_NAME}.mk; then
    sed -i.bak "s|scripts/update_${APP_NAME}.sh|scripts/update_${APP_NAME}.sh -s \$(VERSION)|" \
      "${PWD}/scripts/make/${APP_NAME}.mk" && rm "${PWD}/scripts/make/${APP_NAME}.mk.bak"
  fi

  printf "File '%s' patched.\n" "scripts/make/${APP_NAME}.mk"
}

main() {
  printf "Applying patch: %s ...\n" ${TARGET_VERSION}

  migrate_make_studio_update

  printf "Patch %s applied.\n" ${TARGET_VERSION}
}

main
