#!/bin/bash

REPO_URL=iqb-berlin/testcenter

select_version() {
  source .env
  printf "\nInstalled version: $VERSION\n\n"

  versions=$(curl -s -H "Accept: application/json" https://api.github.com/repos/$REPO_URL/releases)
#  echo "$versions" | jq -r 'map({name, tag_name, prerelease}) | .[] | select(.prerelease == true)'
  echo "[\"Index\",\"Tag name\", \"Release title\"]" | jq -r '@tsv'
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
    read  -p 'Choose version index: [1-'${number_of_versions}']' -r -n 1 -e chosen_version_index
  done
  chosen_version_tag=$(echo "$versions" | jq -r '.['${chosen_version_index}-1'] | .tag_name')
}

update_files() {
  wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/Makefile
  wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.yml
  wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/docker-compose.prod.tls.yml
  wget -nv -O patch.sh https://raw.githubusercontent.com/${REPO_URL}/${chosen_version_tag}/dist-src/patch.sh || rm -f patch.sh

  . .env
  echo "$TLS"
  if [ "$TLS" = "on" ]; then
    sed -i 's/docker-compose.prod.yml/docker-compose.prod.yml -f docker-compose.prod.tls.yml/' Makefile
  fi

  if test -f "patch.sh"; then
    echo "Patch file found."
    chmod +x patch.sh
    patch.sh
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

if [ $main_choice = 1 ]; then
  select_version
  update_files
elif [ $main_choice = 2 ]; then
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