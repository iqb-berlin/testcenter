#!/bin/bash

set -e

APP_NAME='testcenter'
REPO_URL='https://api.github.com/repos/iqb-berlin/testcenter'

REQUIRED_PACKAGES=(docker docker-compose)
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

load_install_package() {
  if ls $APP_NAME-*.tar 1> /dev/null 2>&1
    then
      PACKAGE_FOUND=true
      if [ $(ls $APP_NAME-*.tar | wc -l) -gt 1 ]
        then
          echo "Multiple install packages found. You must not have more then one \"$APP_NAME-*.tar\" file in this directory to continue."
          exit 1
      fi
      read -p "Installation package found. Do you want to check for and download the latest release anyway? [y/N]:" -r -n 1 -e DOWNLOAD
      DOWNLOAD=${DOWNLOAD:-n}
    else
      PACKAGE_FOUND=false
      read -p "No installation package found. Do you want to download the latest release? [Y/n]:" -r -n 1 -e DOWNLOAD
      DOWNLOAD=${DOWNLOAD:-y}
  fi

  if [ "$PACKAGE_FOUND" = 'false' ] && [[ ! $DOWNLOAD =~ ^[yY]$ ]]
    then
      echo "Cannot continue without install package."
      exit 1
  fi

  if [[ $DOWNLOAD =~ ^[yY]$ ]]
    then
      echo 'Downloading latest package...'
      rm -f $APP_NAME-*.tar;
      curl -s $REPO_URL/releases/latest \
      | grep "browser_download_url.*tar" \
      | cut -d : -f 2,3 \
      | tr -d \" \
      | wget -qi -;
  fi
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
    echo "The certificates need to be put in config/certs and their file name configured in config/cert_config.yml."
    sed -i 's/ws:/wss:/' .env
    mv Makefile Makefile.bu
    mv Makefile-TLS Makefile
  else
    sed -i 's/wss:/ws:/' .env
    mv Makefile Makefile-TLS
    mv Makefile.bu Makefile
  fi
}

check_prerequisites
load_install_package

read  -p '1. Install directory: ' -e -i "`pwd`/$APP_NAME" TARGET_DIR

if [ $(ls -A $TARGET_DIR 2> /dev/null | wc -l) -gt 0 ]
  then
    read -p "You have selected a non empty directory. Continue anyway? (y/N)" -r -n 1 -e CONTINUE
    if [[ ! $CONTINUE =~ ^[yY]$ ]]; then
      exit 1
    fi
fi

mkdir -p $TARGET_DIR
echo "Extracting package..."
tar -xf $APP_NAME*.tar -C $TARGET_DIR
cd $TARGET_DIR

customize_settings
set_tls

read  -p 'Run application now? [y/N]: ' -r -n 1 -e run_app
if [[ $run_app =~ ^[yY]$ ]]; then
  cd $TARGET_DIR
  make run
fi