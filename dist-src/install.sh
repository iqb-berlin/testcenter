#!/bin/bash

set -e

APP_NAME='testcenter'
REPO_URL=iqb-berlin/testcenter
REQUIRED_PACKAGES=("docker -v" "docker compose version")
OPTIONAL_PACKAGES=("make -v")

declare -A ENV_VARS
ENV_VARS[HOSTNAME]=localhost
ENV_VARS[PORT]=80
ENV_VARS[TLS_PORT]=443
ENV_VARS[MYSQL_ROOT_PASSWORD]=secret_root_pw
ENV_VARS[MYSQL_DATABASE]=iqb_tba_testcenter
ENV_VARS[MYSQL_SALT]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 5 | head -n 1)
ENV_VARS[MYSQL_USER]=iqb_tba_db_user
ENV_VARS[MYSQL_PASSWORD]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)

ENV_VAR_ORDER=(HOSTNAME PORT TLS_PORT MYSQL_ROOT_PASSWORD MYSQL_DATABASE MYSQL_SALT MYSQL_USER MYSQL_PASSWORD)

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

choose_version() {
  latest_version_tag=$(curl -s https://api.github.com/repos/$REPO_URL/releases/latest | grep tag_name | cut -d : -f 2,3 | tr -d \" | tr -d , | tr -d " " )
  read -p "Install latest version (${latest_version_tag}) [Y/n]: " -r -n 1 -e latest
  if [[ $latest =~ ^[nN]$ ]]; then
    read -p 'Enter version tag: ' -r -e chosen_version_tag
    if ! curl --head --silent --fail --output /dev/null https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/README.md 2> /dev/null;
     then
      echo "This version tag does not exist."
      exit 1
    fi
  else
    chosen_version_tag=$latest_version_tag
  fi
}

download_files() {
  echo "Downloading files..."
  mkdir -p config
  wget -nv -O .env https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/.env
  wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/Makefile
  wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/docker/docker-compose.yml
  wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.yml
  wget -nv -O config/tls-config.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/tls-config.yml
  wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.tls.yml
  wget -nv -O update.sh https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/update.sh
  wget -nv -O config/nginx.conf https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/frontend/config/nginx.conf
  wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/scripts/database/my.cnf
  chmod +x update.sh
}

customize_settings() {
  echo "Please enter some configuration settings. Passwords are generated randomly."
  for var in "${ENV_VAR_ORDER[@]}"
    do
      read  -p "$var: " -e -i ${ENV_VARS[$var]} new_var
      sed -i "s#$var=.*#$var=$new_var#" .env
    done
}

set_tls() {
  read  -p 'Use TLS? [y/N]: ' -r -n 1 -e TLS
  if [[ $TLS =~ ^[yY]$ ]]; then
    printf "The certificates need to be put in config/certs and their file name configured in config/tls-config.yml.\n"
    sed -i 's/TLS_ENABLED=no/TLS_ENABLED=yes/' .env
    sed -i 's/docker-compose.prod.yml/docker-compose.prod.yml -f docker-compose.prod.tls.yml/' Makefile
  fi
}

check_prerequisites
choose_version

read  -p '1. Install directory: ' -e -i "`pwd`/$APP_NAME" TARGET_DIR

if [ "$(ls -A $TARGET_DIR 2> /dev/null | wc -l)" -gt 0 ]
  then
    read -p "You have selected a non empty directory. Continue anyway? (y/N)" -r -n 1 -e CONTINUE
    if [[ ! $CONTINUE =~ ^[yY]$ ]]; then
      exit 1
    fi
fi

mkdir -p $TARGET_DIR

cd $TARGET_DIR

download_files

customize_settings

# write chosen version tag to env file
sed -i "s#VERSION.*#VERSION=$chosen_version_tag#" .env

set_tls

read -p "Installation complete. Do you want to start the application? [Y/n]:" -r -n 1 -e START
if [[ ! $START =~ [nN] ]]
  then
    make run
  else
    echo "Use 'make run' from the install directory."
fi