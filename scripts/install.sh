#!/bin/bash
set -e

declare APP_NAME='testcenter'

declare INSTALL_SCRIPT_NAME=$0
declare SELECTED_VERSION=$1
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/$APP_NAME"
declare REPO_API="https://api.github.com/repos/iqb-berlin/$APP_NAME"
declare REQUIRED_PACKAGES=("docker -v" "docker compose version")
declare OPTIONAL_PACKAGES=("make -v")

declare -A ENV_VARS
ENV_VARS[HOSTNAME]=localhost
ENV_VARS[REDIS_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
ENV_VARS[MYSQL_ROOT_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
ENV_VARS[MYSQL_SALT]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 5 | head -n 1)
ENV_VARS[MYSQL_USER]=iqb_tba_db_user
ENV_VARS[MYSQL_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)

ENV_VAR_ORDER=(HOSTNAME REDIS_PASSWORD MYSQL_ROOT_PASSWORD MYSQL_SALT MYSQL_USER MYSQL_PASSWORD)

declare TARGET_TAG
declare TARGET_DIR

get_release_version() {
  declare latest_release
  latest_release=$(curl -s -f "$REPO_API"/releases/latest |
    grep tag_name |
    cut -d : -f 2,3 |
    tr -d \" |
    tr -d , |
    tr -d " ")

  while read -p '1. Please name the desired release tag: ' -er -i "$latest_release" TARGET_TAG; do
    if ! curl --head --silent --fail --output /dev/null $REPO_URL/"$TARGET_TAG"/README.md 2>/dev/null; then
      printf "This version tag does not exist.\n"
    else
      break
    fi
  done

  # Check install script matches the selected release ...
  declare old_install_script=$REPO_URL/"$TARGET_TAG"/dist-src/install.sh # TARGET_TAG < 15.3.0
  declare new_install_script=$REPO_URL/"$TARGET_TAG"/scripts/install.sh  # TARGET_TAG >= 15.3.0
  if ! curl --stderr /dev/null "$old_install_script" | diff -q - "$INSTALL_SCRIPT_NAME" &>/dev/null &&
    ! curl --stderr /dev/null "$new_install_script" | diff -q - "$INSTALL_SCRIPT_NAME" &>/dev/null; then

    printf -- '- Current install script does not match the selected release install script!\n'
    printf '  Downloading a new install script for the selected release ...\n'
    mv "$INSTALL_SCRIPT_NAME" "${INSTALL_SCRIPT_NAME}"_old
    if curl -s -f -o install_${APP_NAME}.sh "$old_install_script" || \
      curl -s -f -o install_${APP_NAME}.sh "$new_install_script"; then

      chmod +x install_${APP_NAME}.sh
      printf '  Download successful!\n\n'
    else
      printf '  Download failed!\n\n'
      printf "  '%s' install script finished with error.\n" $APP_NAME
      exit 1
    fi

    printf "  The current install process will now execute the downloaded install script and terminate itself.\n"
    declare is_continue
    read -p "  Do you want to continue? [Y/n] " -er -n 1 is_continue
    if [[ $is_continue =~ ^[nN]$ ]]; then
      printf "\n  You can check the the new install script (e.g.: 'less %s') or " install_${APP_NAME}.sh
      printf "compare it with the old one (e.g.: 'diff %s %s').\n\n" install_${APP_NAME}.sh "${INSTALL_SCRIPT_NAME}"_old

      printf "  If you want to resume this install process, please type: 'bash install_%s.sh %s'\n\n" \
        $APP_NAME "$TARGET_TAG"

      printf "'%s' install script finished.\n" $APP_NAME
      exit 0
    fi

    bash install_${APP_NAME}.sh "$TARGET_TAG"

    # remove old install script
    if [ -f "${INSTALL_SCRIPT_NAME}"_old ]; then
      rm "${INSTALL_SCRIPT_NAME}"_old
    fi

    exit $?
  fi

  printf "\n"
}

check_prerequisites() {
  printf "2. Checking prerequisites:\n\n"

  printf "2.1 Checking required packages ...\n"
  # Check required packages are installed
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

  # Check optional packages are installed
  declare opt_package
  printf "2.2 Checking optional packages ...\n"
  for opt_package in "${OPTIONAL_PACKAGES[@]}"; do
    if $opt_package >/dev/null 2>&1; then
      printf -- "- '%s' is working.\n" "$opt_package"
    else
      printf "%s not working! It is recommended to have the corresponding package installed.\n" "$opt_package"
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
  while read -p '3. Determine installation directory: ' -er -i "$PWD/$APP_NAME" TARGET_DIR; do
    if [ ! -e "$TARGET_DIR" ]; then
      break

    elif [ -d "$TARGET_DIR" ] && [ -z "$(find "$TARGET_DIR" -maxdepth 0 -type d -empty 2>/dev/null)" ]; then
      declare is_continue
      read -p "You have selected a non empty directory. Continue anyway? [y/N] " -er -n 1 is_continue
      if [[ ! $is_continue =~ ^[yY]$ ]]; then
        printf "'%s' installation script finished.\n" $APP_NAME
        exit 0
      fi

      break

    else
      printf "'%s' is not a directory!\n\n" "$TARGET_DIR"
    fi

  done

  printf "\n"

  mkdir -p "$TARGET_DIR"/backup/release
  mkdir -p "$TARGET_DIR"/backup/temp
  mkdir -p "$TARGET_DIR"/config/traefik
  mkdir -p "$TARGET_DIR"/scripts/make
  mkdir -p "$TARGET_DIR"/scripts/migration
  mkdir -p "$TARGET_DIR"/secrets/traefik/certs/acme

  cd "$TARGET_DIR"
}

download_file() {
  if curl -s -f -o "$1" $REPO_URL/"$TARGET_TAG"/"$2"; then
    printf -- "- File '%s' successfully downloaded.\n" "$1"

  else
    printf -- "- File '%s' download failed.\n\n" "$1"
    printf "'%s' installation script finished with error.\n" $APP_NAME
    exit 1
  fi
}

download_files() {
  printf "4. Downloading files:\n"

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
  printf "5. Set Environment variables (default passwords are generated randomly):\n"

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
  printf "'%s' installation done.\n\n" $APP_NAME

  if command make -v >/dev/null 2>&1; then
    local is_start_now
    read -p "Do you want to start $APP_NAME now? [Y/n] " -er -n 1 is_start_now
    printf '\n'
    if [[ ! $is_start_now =~ [nN] ]]; then
      make testcenter-up
    else
      printf "'%s' installation script finished.\n" $APP_NAME
      exit 0
    fi

  else
    printf 'You can start the docker services now.\n\n'
    printf "'%s' installation script finished.\n" $APP_NAME
    exit 0
  fi
}

main() {
  if [ -z "$SELECTED_VERSION" ]; then
    printf "\n==================================================\n"
    printf "'%s' installation script started ..." $APP_NAME | tr '[:lower:]' '[:upper:]'
    printf "\n==================================================\n"
    printf "\n"

    get_release_version

    check_prerequisites

    prepare_installation_dir

    download_files

    customize_settings

    application_start

  else

    TARGET_TAG="$SELECTED_VERSION"

    check_prerequisites

    prepare_installation_dir

    download_files

    customize_settings

    application_start

  fi
}

main
