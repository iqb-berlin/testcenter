#!/bin/bash

REPO_URL='https://api.github.com/repos/iqb-berlin/testcenter'
SOFTWARE_COMPONENTS=(iqbberlin/testcenter-frontend iqbberlin/testcenter-backend iqbberlin/testcenter-broadcasting-service)

echo "1. Update to latest version"
echo "2. Switch TLS on/off"
read  -p 'What do you want to do (1/2): ' -r -n 1 -e main_choice

# Returns true if the first version string is greater than the second
is_version_newer() {
  test $(echo $1 | cut -d '.' -f 1) -eq $(echo $2 | cut -d '.' -f 1)
  first_number_equals=$?
  test $(echo $1 | cut -d '.' -f 2) -eq $(echo $2 | cut -d '.' -f 2)
  second_number_equals=$?

  NEWER_VERSION=false
  if [ $(echo $1 | cut -d '.' -f 1) -gt $(echo $2 | cut -d '.' -f 1) ]
    then
      NEWER_VERSION=true
  fi
  if [ $first_number_equals = 0 ] && [ $(echo $1 | cut -d '.' -f 2) -gt $(echo $2 | cut -d '.' -f 2) ]
    then
      NEWER_VERSION=true
  fi
  if [ $first_number_equals = 0 ] && [ $second_number_equals = 0 ] && [ $(echo $1 | cut -d '.' -f 3) -gt $(echo $2 | cut -d '.' -f 3) ]
    then
      NEWER_VERSION=true
  fi
  echo "$NEWER_VERSION"
}

update() {
  current_version=`grep "image: iqbberlin/testcenter-backend:" docker-compose.prod.yml | cut -d : -f 3`
  latest_version=`curl -s $REPO_URL/releases/latest \
    | grep "tag_name" \
    | cut -d : -f 2 \
    | tr -d \" \
    | tr -d , \
    | tr -d ' '`

  is_version_newer=$(is_version_newer $latest_version $current_version)

  if [ $is_version_newer = 'true' ]; then
    echo "A newer version is available: $current_version -> $latest_version"
    read -p "Do you want to update to the latest release? [Y/n]:" -r -n 1 -e UPDATE
    if [[ $UPDATE =~ ^[nN]$ ]]
      then
        echo 'Exiting...'
        exit 0
    fi
    for component in "${SOFTWARE_COMPONENTS[@]}"; do
      sed -i "s#image: $component:.*#image: $component:$latest_version#" docker-compose.prod.yml
    done
  else
    echo "You are up to date."
  fi
}

set_tls() {
  read  -p 'Use TLS? [y/N]: ' -r -n 1 -e TLS
  if [[ $TLS =~ ^[yY]$ ]]
  then
    echo "The certificates need to be put in config/certs and their name configured in config/cert_config.yml."
    sed -i 's/ws:/wss:/' .env

    printf "run:\n    " > Makefile2
    printf "docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.prod.tls.yml up -d\n\n" >> Makefile2
    printf "stop:\n    " >> Makefile2
    printf "docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.prod.tls.yml stop" >> Makefile2
  else
    printf "run:\n    " > Makefile2
    printf "docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d\n\n" >> Makefile2
    printf "stop:\n    " >> Makefile2
    printf "docker-compose -f docker-compose.yml -f docker-compose.prod.yml stop" >> Makefile2
  fi
}


if [ $main_choice = 1 ]; then
  update
elif [ $main_choice = 2 ]; then
  set_tls
fi