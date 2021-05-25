#!/bin/bash

source config/install_config

compare_version_string() {
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

TAG=`curl -s $REPO_URL/releases/latest \
| grep "tag_name" \
| cut -d : -f 2 \
| tr -d \" \
| tr -d , \
| tr -d ' '`

ANY_NEW_VERSION=false

declare -A new_versions
for component in ${!components[@]}
do
  OLD_VERSION=`grep "image: $component:" docker-compose.prod.yml | cut -d : -f 3`
  NEW_VERSION=`echo "$TAG" | grep -oP ${components[$component]}`
  echo "$component: $OLD_VERSION -> $NEW_VERSION"

  NEWER_VERSION=$(compare_version_string $NEW_VERSION $OLD_VERSION)
  if [ $NEWER_VERSION = 'true' ]
    then
      ANY_NEW_VERSION=true
      new_versions[$component]=$NEW_VERSION
  fi
done

if [ $ANY_NEW_VERSION = 'true' ]
  then
    read -p "Newer version found. Do you want to update to the latest release? [Y/n]:" -r -n 1 -e UPDATE
    if [[ $UPDATE =~ ^[nN]$ ]]
      then
        echo 'Exiting...'
        exit 0
    fi
else
  echo 'Everything up to date'
  exit 0
fi

for component in ${!new_versions[@]}; do
  sed -i "s#image: $component:.*#image: $component:${new_versions[$component]}#" docker-compose.prod.yml
done

read -p "Update applied. Do you want to restart the server? This may take a few minutes. [Y/n]:" -r -n 1 -e RESTART
if [[ ! $RESTART =~ [nN] ]]
  then
    make down
    make pull
    make run-detached
  else
    echo 'Exiting...'
    exit 0
fi
