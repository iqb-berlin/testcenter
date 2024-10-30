#!/bin/bash
source .env

declare APP_NAME="testcenter"
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/${APP_NAME}"

printf "Applying patch: 15.3.0 ...\n"

# Create updated app dir structure
mkdir -p ./backup/release
mkdir -p ./backup/temp
mkdir -p ./config/traefik
mkdir -p ./scripts/make
mkdir -p ./scripts/migration
mkdir -p ./secrets/traefik

# Download updated compose files
wget -nv -O docker-compose.yml ${REPO_URL}/${VERSION}/docker/docker-compose.yml
wget -nv -O docker-compose.prod.yml ${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.yml
wget -nv -O docker-compose.prod.tls.yml ${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.tls.yml

# Download new Makefile
wget -nv -O scripts/make/"${APP_NAME}".mk ${REPO_URL}/${VERSION}/scripts/make/prod.mk
sed -i.bak "s#scripts/update.sh#scripts/update_${APP_NAME}.sh#" scripts/make/"${APP_NAME}".mk
printf "include scripts/make/%s.mk\n" "${APP_NAME}" >Makefile

# Download new update file
wget -nv -O scripts/update_"${APP_NAME}".sh ${REPO_URL}/${VERSION}/scripts/update.sh
if [ -f update.sh ]; then
  rm update.sh
fi

# Download new traefik config file
wget -nv -O config/traefik/tls-config.yml ${REPO_URL}/${VERSION}/config/traefik/tls-config.yml
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

printf "Patch 15.3.0 applied.\n"
