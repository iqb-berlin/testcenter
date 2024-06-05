#!/bin/bash

set -e

APP_NAME='testcenter'
REPO_URL=iqb-berlin/testcenter
VERSION=15.2.0-alpha8
REQUIRED_PACKAGES=("docker -v" "docker compose version")
# dpkg to compare versions in the updater
OPTIONAL_PACKAGES=("make -v" "dpkg --version")

declare -A ENV_VARS
ENV_VARS[HOSTNAME]=localhost
ENV_VARS[MYSQL_ROOT_PASSWORD]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
ENV_VARS[MYSQL_SALT]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 5 | head -n 1)
ENV_VARS[MYSQL_USER]=iqb_tba_db_user
ENV_VARS[MYSQL_PASSWORD]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)

ENV_VAR_ORDER=(HOSTNAME MYSQL_ROOT_PASSWORD MYSQL_SALT MYSQL_USER MYSQL_PASSWORD)

check_prerequisites() {
  for app in "${REQUIRED_PACKAGES[@]}"
  do
    {
      $app > /dev/null 2>&1
    } || {
      echo "$app not found, please install before running!"
      exit 1
    }
  done
  for app in "${OPTIONAL_PACKAGES[@]}"
  do
    {
      $app > /dev/null 2>&1
    } || {
      echo "$app not found! It is recommended to have it installed."
      read  -p 'Continue anyway? (y/N): ' -r -n 1 -e CONTINUE

      if [[ ! $CONTINUE =~ ^[yY]$ ]]; then
        exit 1
      fi
    }
  done
}

download_files() {
  echo "Downloading files..."
  wget -nv -O .env https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/.env
  wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/Makefile
  wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/docker/docker-compose.yml
  wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.yml
  wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.tls.yml
  wget -nv -O config/tls-config.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/tls-config.yml
  wget -nv -O config/nginx.conf https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/frontend/config/nginx.conf
  wget -nv -O update.sh https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/update.sh
  chmod +x update.sh
}

customize_settings() {
  echo
  echo "Please enter some configuration settings. Passwords are generated randomly."
  for var in "${ENV_VAR_ORDER[@]}"
    do
      read  -p "$var: " -e -i ${ENV_VARS[$var]} new_var
      sed -i "s#$var=.*#$var=$new_var#" .env
    done
}

### Main logic starts here #########################

check_prerequisites

echo "Installing IQB-Testcenter version: $VERSION"

read  -p '1. Install directory: ' -e -i "`pwd`/$APP_NAME" TARGET_DIR

if [ "$(ls -A $TARGET_DIR 2> /dev/null | wc -l)" -gt 0 ]
  then
    read -p "You have selected a non empty directory. Continue anyway? (y/N)" -r -n 1 -e CONTINUE
    if [[ ! $CONTINUE =~ ^[yY]$ ]]; then
      exit 1
    fi
fi

mkdir -p $TARGET_DIR/config/certs

cd $TARGET_DIR

download_files

customize_settings

echo "Installation complete. Use 'make run' from the install directory."
