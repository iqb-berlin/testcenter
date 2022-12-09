#!/bin/bash

REPO_URL=iqb-berlin/testcenter

select_version() {
  source .env
  printf "\nInstalled version: $VERSION\n\n"

  latest_version_tag=$(curl -s https://api.github.com/repos/$REPO_URL/releases/latest | grep tag_name | cut -d : -f 2,3 | tr -d \" | tr -d , | tr -d " " )
  printf "Latest available version: $latest_version_tag\n"

  if [ $VERSION = $latest_version_tag ]; then
    echo "Latest version is already installed."
    exit 0
  fi

  read -p 'Install latest version [Y/n]: ' -r -n 1 -e latest
  if [[ $latest =~ ^[nN]$ ]]; then
    echo "choose manually"
    read -p 'Enter version tag: ' -r -e chosen_version_tag
    if ! curl --head --silent --fail --output /dev/null https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/README.md 2> /dev/null;
     then
      echo "This version tag does not exist."
      exit 1
    fi
  else
    echo "Installing latest"
    chosen_version_tag=$latest_version_tag
  fi
  echo "Chosen:$chosen_version_tag"
}

create_backup() {
  mkdir -p backup/$(date +"%m-%d-%Y")
  mv Makefile docker-compose.yml docker-compose.prod.yml docker-compose.prod.tls.yml config/nginx.conf backup/$(date +"%m-%d-%Y")
  echo "Backup created. Files have been moved to: backup/$(date +"%m-%d-%Y")"
}

update_files() {
  wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/Makefile
  wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/docker/docker-compose.yml
  wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.yml
  wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.tls.yml
  wget -nv -O config/nginx.conf https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/frontend/config/nginx.conf
  wget -nv -O patch.sh https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/patch.sh || rm -f patch.sh

  sed -i "s#VERSION=.*#VERSION=$chosen_version_tag#" .env

  . .env
  echo "$TLS"
  if [ "$TLS" = "on" ]; then
    sed -i 's/docker-compose.prod.yml/docker-compose.prod.yml -f docker-compose.prod.tls.yml/' Makefile
  fi

  if test -f "patch.sh"; then
    echo "Patch file found."
    chmod +x patch.sh
    bash patch.sh
  fi
}

set_tls() {
  read -p 'Use TLS? [y/N]: ' -r -n 1 -e TLS
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

echo "1. Update version"
echo "2. Switch TLS on/off"
read  -p 'What do you want to do (1/2): ' -r -n 1 -e main_choice

if [ "$main_choice" = 1 ]; then
  select_version
  create_backup
  update_files
elif [ "$main_choice" = 2 ]; then
  set_tls
fi

read -p "Update applied. Do you want to restart the application? [Y/n]:" -r -n 1 -e RESTART
if [[ ! $RESTART =~ [nN] ]]
  then
    make restart
  else
    echo 'Done'
    exit 0
fi