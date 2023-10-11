#!/bin/bash

REPO_URL=iqb-berlin/testcenter

create_backup() {
  mkdir -p backup/$(date +"%m-%d-%Y")
  mv !(backup/$(date +"%m-%d-%Y") backup/$(date +"%m-%d-%Y")
  cp .env backup/$(date +"%m-%d-%Y")
  echo "Backup created. Files have been moved to: backup/$(date +"%m-%d-%Y")"
}

update_files() {
  wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/Makefile
  wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/docker/docker-compose.yml
  wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.yml
  wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.tls.yml
  wget -nv -O config/nginx.conf https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/frontend/config/nginx.conf
  wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/scripts/database/my.cnf
  wget -nv -O patch.sh https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/patch.sh || rm -f patch.sh

  sed -i "s#VERSION=.*#VERSION=$chosen_version_tag#" .env

  if test -f "patch.sh"; then
    echo "Patch file found."
    chmod +x patch.sh
    bash patch.sh
  fi
}

source .env
printf "\nInstalled version: $VERSION\n\n"
latest_version_tag=$(curl -s https://api.github.com/repos/$REPO_URL/releases/latest | grep tag_name | cut -d : -f 2,3 | tr -d \" | tr -d , | tr -d " " )
printf "Latest available version: $latest_version_tag\n"

if [ $VERSION = $latest_version_tag ]; then
  echo "Latest version is already installed."
  exit 0
fi

chosen_version_tag=$latest_version_tag

create_backup
update_files

read -p "Update applied. Do you want to restart the application? [Y/n]:" -r -n 1 -e RESTART
if [[ ! $RESTART =~ [nN] ]]
  then
    make restart
  else
    echo 'Done'
    exit 0
fi