#!/bin/bash

OLD_BACKEND_VERSION=`grep 'image: iqbberlin/testcenter-backend:' docker-compose.prod.yml \
| cut -d : -f 3`
OLD_FRONTEND_VERSION=`grep 'image: iqbberlin/testcenter-frontend:' docker-compose.prod.yml \
| cut -d : -f 3`
OLD_BROADCASTING_SERVICE_VERSION=`grep 'image: iqbberlin/testcenter-broadcasting-service:' docker-compose.prod.yml \
| cut -d : -f 3`

TAG=`curl -s https://api.github.com/repos/iqb-berlin/testcenter-setup/releases/latest \
| grep "tag_name" \
| cut -d : -f 2 \
| tr -d \" \
| tr -d , \
| tr -d ' '`

NEW_FRONTEND_VERSION=$(echo $TAG | cut -d '@' -f 1)
NEW_BACKEND_VERSION=$(echo $TAG | cut -d '@' -f 2 | cut -d + -f 1)
NEW_BROADCASTING_SERVICE_VERSION=$(echo $TAG | cut -d '@' -f 2 | cut -d + -f 2)

compare_version_string() {
  test $(echo $1 | cut -d '.' -f 1) -eq $(echo $2 | cut -d '.' -f 1)
  first_number_equals=$?
  test $(echo $1 | cut -d '.' -f 2) -eq $(echo $2 | cut -d '.' -f 2)
  second_number_equals=$?

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

}

NEWER_VERSION=false
compare_version_string $NEW_BACKEND_VERSION $OLD_BACKEND_VERSION
compare_version_string $NEW_FRONTEND_VERSION $OLD_FRONTEND_VERSION
compare_version_string $NEW_BROADCASTING_SERVICE_VERSION $OLD_BROADCASTING_SERVICE_VERSION
if [ $NEWER_VERSION = 'true' ]
  then
    echo "Newer version found:
Backend: $OLD_BACKEND_VERSION -> $NEW_BACKEND_VERSION
Frontend: $OLD_FRONTEND_VERSION -> $NEW_FRONTEND_VERSION
Broadcasting Service: $OLD_BROADCASTING_SERVICE_VERSION -> $NEW_BROADCASTING_SERVICE_VERSION"
  else
    echo 'Up to date'
    exit 0
fi

read -p "Do you want to update to the latest release? [Y/n]:" -e UPDATE
if [[ ! $DOWNLOAD =~ ^[yY]$]]
  then
    sed -i "s/image: iqbberlin\/testcenter-backend:.*/image: iqbberlin\/testcenter-backend:$NEW_BACKEND_VERSION/" docker-compose.prod.yml
    sed -i "s/image: iqbberlin\/testcenter-frontend:.*/image: iqbberlin\/testcenter-frontend:$NEW_FRONTEND_VERSION/" docker-compose.prod.yml
    sed -i "s/image: iqbberlin\/testcenter-broadcasting-service:.*/image: iqbberlin\/testcenter-broadcasting-service:$NEW_BROADCASTING_SERVICE_VERSION/" docker-compose.prod.yml
fi

read -p "Update applied. Do you want to restart the server? This may take a few minutes. [Y/n]:" -e RESTART
if [[ ! $RESTART =~ ^[nN]$]]
  then
    make down
    make pull
    make run-detached
fi
