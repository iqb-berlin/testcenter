#!/usr/bin/env bash
source .env

declare APP_NAME="testcenter"
declare TARGET_VERSION="15.3.0"
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/${APP_NAME}/${TARGET_VERSION}"

printf "Applying patch: %s ...\n" ${TARGET_VERSION}

# Create updated app dir structure
mkdir -p ./backup/release
mkdir -p ./backup/temp
mkdir -p ./config/traefik
mkdir -p ./scripts/make
mkdir -p ./scripts/migration
mkdir -p ./secrets/traefik

# Download updated compose files
curl --silent --fail --output docker-compose.yml ${REPO_URL}/docker/docker-compose.yml
curl --silent --fail --output docker-compose.prod.yml ${REPO_URL}/dist-src/docker-compose.prod.yml
curl --silent --fail --output docker-compose.prod.tls.yml ${REPO_URL}/dist-src/docker-compose.prod.tls.yml

# Download new Makefile
curl --silent --fail --output scripts/make/"${APP_NAME}".mk ${REPO_URL}/scripts/make/prod.mk
sed -i.bak "s#scripts/update.sh#scripts/update_${APP_NAME}.sh#" scripts/make/"${APP_NAME}".mk
printf "include scripts/make/%s.mk\n" "${APP_NAME}" >Makefile

# Download new update file
curl --silent --fail --output scripts/update_"${APP_NAME}".sh ${REPO_URL}/scripts/update.sh
if [ -f update.sh ]; then
  rm update.sh
fi

# Download new traefik config file
curl --silent --fail --output config/traefik/tls-config.yml ${REPO_URL}/config/traefik/tls-config.yml
if [ -f config/tls-config.yml ]; then
  mv config/tls-config.yml config/traefik/tls-config.yml_bkp
fi

# Move certificates to secrets directory
if [ -d config/certs/ ]; then
  mv config/certs/ secrets/traefik/
fi

mkdir -p ./secrets/traefik/certs/letsencrypt

# Rename docker environment file
mv .env .env.prod

printf "Patch %s applied.\n" ${TARGET_VERSION}
