#!/bin/bash

declare APP_NAME="testcenter"

printf "Applying patch: 15.3.0 ...\n"

# Add specialized config subdirectories
if [ -f config/nginx.conf ]; then
  mv config/nginx.conf config/frontend/nginx.conf
fi
if [ -f config/tls-config.yml ]; then
  mkdir -p config/traefik/
  mv config/tls-config.yml config/traefik/tls-config.yml
fi

# Move certificates to secrets directory
if [ -d config/certs/ ]; then
  mkdir -p secrets/traefik
  mv config/certs/ secrets/traefik/
fi

# Add scripts directory
mkdir -p scripts/make
mkdir -p scripts/migration

mv Makefile scripts/make/"${APP_NAME}".mk
printf "include scripts/make/%s.mk\n" "${APP_NAME}" >Makefile

if [ -f update.sh ]; then
  mv update.sh scripts/update_"${APP_NAME}".sh
  sed -i.bak "s#scripts/update.sh#scripts/update_${APP_NAME}.sh#" scripts/make/$APP_NAME.mk &&
    rm scripts/make/$APP_NAME.mk.bak
fi

# Rename docker environment file
mv .env .env."${APP_NAME}"

# Add backup directory
mkdir -p backup/release
mkdir -p backup/temp

printf "Patch 15.3.0 applied.\n"
