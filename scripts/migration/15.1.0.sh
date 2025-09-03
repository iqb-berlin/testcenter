#!/usr/bin/env bash

source .env

declare TARGET_VERSION="15.1.0"
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/testcenter/${TARGET_VERSION}"

printf "Applying patch: %s ...\n" ${TARGET_VERSION}

# Change base compose file for 'www-fix'
curl --silent --fail --output docker-compose.yml ${REPO_URL}/docker/docker-compose.yml

# Change compose file for non-tls setup
curl --silent --fail --output docker-compose.prod.yml ${REPO_URL}/dist-src/docker-compose.prod.yml

# Download additional compose file
curl --silent --fail --output docker-compose.prod.tls.yml ${REPO_URL}/dist-src/docker-compose.prod.tls.yml

# Change Makefile for non-tls setup
curl --silent --fail --output Makefile ${REPO_URL}/dist-src/Makefile

# TLS is optional again
if [ -z "$TLS_ENABLED" ]; then
  echo -e "TLS_ENABLED=yes" >>.env
fi

printf "Patch %s applied.\n" ${TARGET_VERSION}
