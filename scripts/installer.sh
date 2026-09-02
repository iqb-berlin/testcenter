#!/usr/bin/env bash
set -e

declare APP_NAME='testcenter'

declare TARGET_TAG=$1
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/$APP_NAME"
declare REQUIRED_PACKAGES=("docker -v" "docker compose version")
declare OPTIONAL_PACKAGES=("make -v")

if [ -z "$TARGET_TAG" ]; then
  printf "No release tag given.\n"
  printf "This script is not meant to be run directly - use 'install.sh' instead, which downloads\n"
  printf "and runs the matching version of this script automatically.\n"
  exit 1
fi

declare -A ENV_VARS
ENV_VARS[HOSTNAME]=localhost
ENV_VARS[REDIS_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
ENV_VARS[MYSQL_ROOT_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
ENV_VARS[MYSQL_USER]=iqb_tba_db_user
ENV_VARS[MYSQL_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
ENV_VARS[PASSWORD_SALT]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 5 | head -n 1)

ENV_VAR_ORDER=(HOSTNAME REDIS_PASSWORD MYSQL_ROOT_PASSWORD MYSQL_USER MYSQL_PASSWORD PASSWORD_SALT)

declare TARGET_DIR

check_prerequisites() {
  printf "Checking prerequisites:\n\n"

  printf "Checking required packages ...\n"
  declare req_package
  for req_package in "${REQUIRED_PACKAGES[@]}"; do
    if $req_package >/dev/null 2>&1; then
      printf -- "- '%s' is working.\n" "$req_package"
    else
      printf "'%s' not working, please install the corresponding package before running!\n" "$req_package"
      exit 1
    fi
  done
  printf "Required packages successfully checked.\n\n"

  declare opt_package
  printf "Checking optional packages ...\n"
  for opt_package in "${OPTIONAL_PACKAGES[@]}"; do
    if $opt_package >/dev/null 2>&1; then
      printf -- "- '%s' is working.\n" "$opt_package"
    else
      printf "'%s' not working! It is recommended to have the corresponding package installed.\n" "$opt_package"
      declare is_continue
      read -p 'Continue anyway? [y/N] ' -er -n 1 is_continue

      if [[ ! $is_continue =~ ^[yY]$ ]]; then
        exit 1
      fi
    fi
  done
  printf "Optional packages successfully checked.\n\n"

  printf "\nPrerequisites check finished successfully.\n\n"
}

prepare_installation_dir() {
  while read -p 'Determine installation directory: ' -er -i "$PWD/$APP_NAME" TARGET_DIR; do
    # Non-existing or existing-but-empty directories are both fine to install into as-is.
    if [ ! -e "$TARGET_DIR" ] || [ -n "$(find "$TARGET_DIR" -maxdepth 0 -type d -empty 2>/dev/null)" ]; then
      break
    elif [ ! -d "$TARGET_DIR" ]; then
      printf "'%s' is not a directory!\n\n" "$TARGET_DIR"
    else
      declare is_continue
      read -p "You have selected a non-empty directory. Continue anyway? [y/N] " -er -n 1 is_continue
      if [[ ! $is_continue =~ ^[yY]$ ]]; then
        printf "'%s' installation script finished.\n" "$APP_NAME"
        exit 0
      fi

      break
    fi
  done

  printf "\n"

  mkdir -p "$TARGET_DIR"/backup
  mkdir -p "$TARGET_DIR"/backup/release
  mkdir -p "$TARGET_DIR"/backup/temp
  mkdir -p "$TARGET_DIR"/config/traefik
  mkdir -p "$TARGET_DIR"/scripts/make
  mkdir -p "$TARGET_DIR"/scripts/migration
  mkdir -p "$TARGET_DIR"/secrets/traefik/certs/acme

  cd "$TARGET_DIR"
}

download_file() {
  if curl -s -f -o "$1" "$REPO_URL"/"$TARGET_TAG"/"$2"; then
    printf -- "- File '%s' successfully downloaded.\n" "$1"
  else
    printf -- "- File '%s' download failed.\n\n" "$1"
    printf "'%s' installation script finished with error.\n" "$APP_NAME"
    exit 1
  fi
}

download_files() {
  printf "Downloading files:\n"

  download_file docker-compose.yml docker-compose.yml
  download_file docker-compose.prod.yml docker-compose.prod.yml
  download_file docker-compose.prod.tls.yml docker-compose.prod.tls.yml
  download_file .env.prod-template .env.prod-template
  download_file config/traefik/tls-acme.yml config/traefik/tls-acme.yml
  download_file config/traefik/tls-certificates.yml config/traefik/tls-certificates.yml
  download_file config/traefik/tls-options.yml config/traefik/tls-options.yml
  download_file scripts/make/$APP_NAME.mk scripts/make/prod.mk
  download_file scripts/update_$APP_NAME.sh scripts/update.sh
  chmod +x scripts/update_$APP_NAME.sh

  printf "Downloads done!\n\n"
}

customize_settings() {
  # Activate environment file
  cp .env.prod-template .env.prod

  # Load docker environment variables
  source .env.prod

  # Setup environment variables
  printf "Set environment variables (default passwords are generated randomly):\n"

  # Persist selected release version
  sed -i.bak "s|^VERSION=.*|VERSION=$TARGET_TAG|" .env.prod && rm .env.prod.bak

  declare env_var_name
  for env_var_name in "${ENV_VAR_ORDER[@]}"; do
    declare env_var_value
    read -p "${env_var_name}: " -er -i "${ENV_VARS[${env_var_name}]}" env_var_value
    sed -i.bak "s|^${env_var_name}=.*|${env_var_name}=${env_var_value}|" .env.prod && rm .env.prod.bak
  done

  read -p 'Use TLS? [Y/n]: ' -r -n 1 -e TLS
  if [[ $TLS =~ ^[nN]$ ]]; then
    sed -i.bak 's|^TLS_ENABLED=true|TLS_ENABLED=false|' .env.prod && rm .env.prod.bak
  fi

  read -p "Use an ACME-Provider for TLS, like 'Let's encrypt' or 'Sectigo'? [Y/n]: " -r -n 1 -e TLS
  if [[ $TLS =~ ^[nN]$ ]]; then
    sed -i.bak "s|^TLS_CERTIFICATE_RESOLVER=.*|TLS_CERTIFICATE_RESOLVER=|" .env.prod && rm .env.prod.bak
  else
    sed -i.bak "s|^TLS_CERTIFICATE_RESOLVER=.*|TLS_CERTIFICATE_RESOLVER=acme|" .env.prod && rm .env.prod.bak

    read -p "TLS_ACME_CA_SERVER: " -er -i "${TLS_ACME_CA_SERVER}" TLS_ACME_CA_SERVER
    sed -i.bak "s|^TLS_ACME_CA_SERVER=.*|TLS_ACME_CA_SERVER=${TLS_ACME_CA_SERVER}|" .env.prod && rm .env.prod.bak

    read -p "TLS_ACME_EAB_KID: " -er -i "${TLS_ACME_EAB_KID}" TLS_ACME_EAB_KID
    sed -i.bak "s|^TLS_ACME_EAB_KID=.*|TLS_ACME_EAB_KID=${TLS_ACME_EAB_KID}|" .env.prod && rm .env.prod.bak

    read -p "TLS_ACME_EAB_HMAC_ENCODED: " -er -i "${TLS_ACME_EAB_HMAC_ENCODED}" TLS_ACME_EAB_HMAC_ENCODED
    sed -i.bak "s|^TLS_ACME_EAB_HMAC_ENCODED=.*|TLS_ACME_EAB_HMAC_ENCODED=${TLS_ACME_EAB_HMAC_ENCODED}|" .env.prod &&
      rm .env.prod.bak

    read -p "TLS_ACME_EMAIL: " -er -i "${TLS_ACME_EMAIL}" TLS_ACME_EMAIL
    sed -i.bak "s|^TLS_ACME_EMAIL=.*|TLS_ACME_EMAIL=${TLS_ACME_EMAIL}|" .env.prod && rm .env.prod.bak
  fi

  # Setup makefiles
  sed -i.bak "s|^TC_BASE_DIR :=.*|TC_BASE_DIR := \\$TARGET_DIR|" scripts/make/${APP_NAME}.mk &&
    rm scripts/make/${APP_NAME}.mk.bak
  sed -i.bak "s|scripts/update.sh|scripts/update_${APP_NAME}.sh|" scripts/make/${APP_NAME}.mk &&
    rm scripts/make/${APP_NAME}.mk.bak
  printf "include %s/scripts/make/$APP_NAME.mk\n" "$TARGET_DIR" >"$TARGET_DIR"/Makefile

  printf "\n"
}

application_start() {
  printf "'%s' installation done.\n\n" "$APP_NAME"

  if command make -v >/dev/null 2>&1; then
    declare is_start_now
    read -p "Do you want to start $APP_NAME now? [Y/n] " -er -n 1 is_start_now
    printf '\n'
    if [[ ! $is_start_now =~ [nN] ]]; then
      make testcenter-up
    else
      printf "'%s' installation script finished.\n" "$APP_NAME"
      exit 0
    fi
  else
    printf 'You can start the docker services now.\n\n'
    printf "'%s' installation script finished.\n" "$APP_NAME"
    exit 0
  fi
}

main() {
  printf "Installing release '%s' ...\n\n" "$TARGET_TAG"

  check_prerequisites

  prepare_installation_dir

  download_files

  customize_settings

  application_start
}

main
