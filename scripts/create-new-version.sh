#!/bin/bash
set -e

if [ "$1" == '' ]; then
  echo "usage: bash scripts/create-new-version.sh [major|minor|patch][-{label}]"
  echo "example: bash scripts/create_new_version.sh minor"
  exit 1;
fi

if [ "$(git symbolic-ref --short HEAD)" != "master" ]; then
  echo "Not on master!";
  exit 1;
fi

make docs-user
make new-version version=$1

git add dist-src/.env
git add docs/CHANGELOG.md
git add docs/pages/*
git add package.json
git add package-lock.json
git add sampledata/*
git add dist-src/install.sh
git add scripts/database/patches.d/*

if [ ! -e scripts/database/next.sql ]; then
  if [ "$(git status | grep -c scripts/database/next.sql)" -gt 0 ]; then
    git rm scripts/database/next.sql
  fi
fi

git status

VERSION=$(npm pkg get version | xargs echo)

read -n1 -p "Commit Version $VERSION? (Y/n) " confirm
if ! echo "$confirm" | grep '^[Yy]\?$'; then
  exit 0
fi

git commit -m "Update to version $VERSION"
git tag $VERSION
git push origin master
git push origin $VERSION


read -n1 -p "Push Images Version $VERSION manually? (y/N) " confirm
if echo "$confirm" | grep '^[Nn]\?$'; then
  exit 0
fi

docker build --target prod -t "iqbberlin/testcenter-backend:$VERSION" -f docker/backend.Dockerfile .
docker build --target prod -t "iqbberlin/testcenter-frontend:$VERSION" -f docker/frontend.Dockerfile .
docker build --target prod -t "iqbberlin/testcenter-broadcasting-service:$VERSION" -f docker/broadcasting-service.Dockerfile .
docker build -t "iqbberlin/testcenter-file-service:$VERSION" -f docker/file-service.Dockerfile .
docker build -t "iqbberlin/testcenter-db:$VERSION" -f docker/database.Dockerfile .

docker login -u "iqbberlin4cicd"

docker push iqbberlin/testcenter-backend:$VERSION
docker push iqbberlin/testcenter-frontend:$VERSION
docker push iqbberlin/testcenter-broadcasting-service:$VERSION
docker push iqbberlin/testcenter-file-service:$VERSION
docker push iqbberlin/testcenter-db:$VERSION

echo "Now go to to https://github.com/iqb-berlin/testcenter/releases and create the new release".