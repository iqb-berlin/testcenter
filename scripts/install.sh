#!/bin/bash

set -e

# Author: Richard Henck (richard.henck@iqb.hu-berlin.de)

### Check installed tools ###
CHECK_INSTALLED=`docker -v`;
if [[ $CHECK_INSTALLED = "docker: command not found" ]]; then
  echo "Docker not found, please install before running!"
  exit 1
else
  echo "Docker found"
fi

CHECK_INSTALLED=`docker-compose -v`;
if [[ $CHECK_INSTALLED = "docker-compose: command not found" ]]; then
  echo "Docker-compose not found, please install before running!"
  exit 1
else
  echo "Docker-Compose found"
fi

CHECK_INSTALLED=`make -v`;
if [[ $CHECK_INSTALLED = "make: command not found" ]]; then
  echo "Make not found! It is recommended to control the application."
  read  -p 'Continue anyway? (y/N): ' -r -n 1 -e CONTINUE

  if [[ $CONTINUE =~ ^[yY]$ ]]; then
    exit 1
  fi
else
  echo "Make found"
fi

### Download package ###
DOWNLOAD='y'
if ls testcenter-*.tar 1> /dev/null 2>&1
  then
    PACKAGE_FOUND=true
    if [ $(ls testcenter-*.tar | wc -l) -gt 1 ]
      then
        echo "Multiple packages found. Remove all but the one you want!"
        exit 1
    fi
    DOWNLOAD='n'
    read -p "Installation package found. Do you want to check for and download the latest release anyway? [y/N]:" -r -n 1 -e DOWNLOAD
  else
    PACKAGE_FOUND=false
    read -p "No installation package found. Do you want to download the latest release? [Y/n]:" -r -n 1 -e DOWNLOAD
fi

if [ "$PACKAGE_FOUND" = 'false' ] && [ "$DOWNLOAD" = 'n' ]
  then
    echo "Can not continue without install package."
    exit 1
fi

if [[ $DOWNLOAD =~ ^[yY]$ ]]
  then
    echo 'Downloading latest package...'
    rm -f testcenter-*.tar;
    curl -s https://api.github.com/repos/iqb-berlin/testcenter-setup/releases/latest \
    | grep "browser_download_url.*tar" \
    | cut -d : -f 2,3 \
    | tr -d \" \
    | wget -qi -;
fi

### Unpack application ###
read  -p 'Install directory: ' -e -i "`pwd`/testcenter" TARGET_DIR
mkdir -p $TARGET_DIR
tar -xf *.tar -C $TARGET_DIR
cd $TARGET_DIR

### Set up config ###
read  -p 'Server Address (hostname or IP): ' -e -i $(hostname) HOSTNAME
sed -i "s/localhost/$HOSTNAME/" .env

read  -p 'Use TLS? (y/N): ' -r -n 1 -e TLS
if [[ $TLS =~ ^[yY]$ ]]
then
  echo "The certificates need to be placed in config/certs and their name configured in config/cert_config.yml."
  sed -i 's/http:/https:/' .env
  sed -i 's/ws:/wss:/' .env
fi

### Populate Makefile ###
if [[ $TLS =~ ^[yY]$ ]]
then
  rm docker-compose.prod.nontls.yml
  sed -i 's/<run-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up/' Makefile-template
  sed -i 's/<run-detached-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d/' Makefile-template
  sed -i 's/<stop-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml stop/' Makefile-template
  sed -i 's/<down-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml down/' Makefile-template
  sed -i 's/<pull-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml pull/' Makefile-template
else
  rm docker-compose.prod.tls.yml
  sed -i 's/<run-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up/' Makefile-template
  sed -i 's/<run-detached-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up -d/' Makefile-template
  sed -i 's/<stop-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml stop/' Makefile-template
  sed -i 's/<down-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml down/' Makefile-template
  sed -i 's/<pull-command>/docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml pull/' Makefile-template
fi

mv Makefile-template Makefile

echo '
 --- INSTALLATION SUCCESSFUL ---
'
echo 'Check the settings and passwords in the file '.env' in the installation directory.'
