#!/bin/bash

set -e

APP_NAME='testcenter'
REPO_URL=iqb-berlin/testcenter
REQUIRED_PACKAGES=("docker" "docker-compose" "jq --help")
OPTIONAL_PACKAGES=(make)

declare -A ENV_VARS
ENV_VARS[HOST_NAME]=localhost
ENV_VARS[MYSQL_ROOT_PASSWORD]=secret_root_pw
ENV_VARS[MYSQL_DATABASE]=iqb_tba_testcenter
ENV_VARS[MYSQL_SALT]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 5 | head -n 1)
ENV_VARS[MYSQL_USER]=iqb_tba_db_user
ENV_VARS[MYSQL_PASSWORD]=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
ENV_VARS[SUPERUSER_NAME]=super
ENV_VARS[SUPERUSER_PASSWORD]=user123

ENV_VAR_ORDER=(HOST_NAME MYSQL_ROOT_PASSWORD MYSQL_DATABASE MYSQL_SALT MYSQL_USER MYSQL_PASSWORD SUPERUSER_NAME SUPERUSER_PASSWORD)

check_prerequisites() {
  for app in "${REQUIRED_PACKAGES[@]}"
  do
    {
      $app -v > /dev/null 2>&1
    } || {
      echo "$app not found, please install before running!"
      exit 1
    }
  done
  for app in "${OPTIONAL_PACKAGES[@]}"
  do
    {
      $app -v > /dev/null 2>&1
    } || {
      echo "$app not found! It is recommended to have it installed."
      read  -p 'Continue anyway? (y/N): ' -r -n 1 -e CONTINUE

      if [[ ! $CONTINUE =~ ^[yY]$ ]]; then
        exit 1
      fi
    }
  done
}

get_version_list_from_api() {
  #read  -p 'Show only stable versions [Y/n]: ' -r -n 1 -e show_stable_versions
  # so koennte man betas filtern: select(.value.prerelease == true)
  versions=$(curl -s -H "Accept: application/json" https://api.github.com/repos/$REPO_URL/releases)
  echo "$versions" | jq -r 'map({tag_name, name, prerelease})
                          | to_entries
                          | map({
                            index: (.key + 1),
                            tag_name: .value.tag_name,
                            name: .value.name,
                            prerelease: (if .value.prerelease == true then "(prerelease)" else "" end)
                          })
                          | .[]
                          | [.[]]
                          | @tsv'

  number_of_versions=$(echo "$versions" | jq -r 'length')

  chosen_version_index=0
  while [[ "$chosen_version_index" -lt 1 || "$chosen_version_index" -gt "$number_of_versions" ]]; do
    read  -p 'Choose version number: [1-'${number_of_versions}']' -r -n 1 -e chosen_version_index
  done
  chosen_version_tag=$(echo "$versions" | jq -r '.['${chosen_version_index}-1'] | .tag_name')
}

download_files() {
  echo "Downloading files..."
  wget -nv -O .env https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/.env
  wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/Makefile
  wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/docker/docker-compose.yml
  wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.yml
  wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.tls.yml
  wget -nv -O manage.sh https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/manage.sh
  chmod +x manage.sh
  echo "Download done"
}

customize_settings() {
  for var in "${ENV_VAR_ORDER[@]}"
    do
      read  -p "$var: " -e -i ${ENV_VARS[$var]} new_var
      sed -i "s#$var.*#$var=$new_var#" .env
    done
}

set_tls() {
  read  -p 'Use TLS? [y/N]: ' -r -n 1 -e TLS
  if [[ $TLS =~ ^[yY]$ ]]; then
    mkdir config
    touch config/cert_config.yml
    echo "tls:
  certificates:
    - certFile: /certs/certificate.cer
      keyFile: /certs/private_key.key" > config/cert_config.yml
    echo "The certificates need to be put in config/certs and their file name configured in config/cert_config.yml."
    sed -i 's/TLS=off/TLS=on/' .env
    sed -i 's/ws:/wss:/' .env
    sed -i 's/docker-compose.prod.yml/docker-compose.prod.yml -f docker-compose.prod.tls.yml/' Makefile
  else
    sed -i 's/TLS=on/TLS=off/' .env
    sed -i 's/wss:/ws:/' .env
    sed -i 's/docker-compose.prod.yml -f docker-compose.prod.tls.yml/docker-compose.prod.yml/' Makefile
  fi
}

check_prerequisites
get_version_list_from_api

read  -p '1. Install directory: ' -e -i "`pwd`/$APP_NAME" TARGET_DIR

if [ $(ls -A $TARGET_DIR 2> /dev/null | wc -l) -gt 0 ]
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

printf "\nInstallation done. Use 'make run' from the install directory.\n"