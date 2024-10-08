#!/bin/bash
set -e

if [ "$1" == '' ]; then
  echo "usage: bash scripts/create-new-version.sh [major|minor|patch][-{label}]"
  echo "example: bash scripts/create_new_version.sh minor"
  exit 1;
fi

if [ "$(git symbolic-ref --short HEAD)" != "master" ]; then
  echo "Not on Master!"
  echo "Current Branch: $(git branch --show-current)"
  read -n1 -p "Continue? (y/N) " confirm
  if echo "$confirm" | grep '^[Nn]\?$'; then
    exit 1;
  fi
fi

make docs-user
make new-version version=$1

VERSION=$(npm pkg get version | xargs echo)

git checkout -b release/$VERSION

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



read -n1 -p "Commit Version $VERSION? (Y/n) " confirm
if ! echo "$confirm" | grep '^[Yy]\?$'; then
  exit 0
fi

git commit -m "Update to version $VERSION"
git push origin "$(git branch --show-current)"


read -n1 -p "☕ NOW WAIT until CI is ready. Proceed? (y/N)" confirm
if ! echo "$confirm" | grep '^[Yy]\?$'; then
  exit 0
fi
read -n1 -p "create pull request, merge. Proceed? (y/N)" confirm #TODO
if ! echo "$confirm" | grep '^[Yy]\?$'; then
  exit 0
fi
read -n1 -p "☕ WAIT AGAIN until CI is ready. Proceed? (y/N)" confirm
if ! echo "$confirm" | grep '^[Yy]\?$'; then
  exit 0
fi

git checkout master
git pull

git tag $VERSION
git push origin $VERSION

git branch -d release/$VERSION
git push origin --delete release/$VERSION

echo "Now go to to https://github.com/iqb-berlin/testcenter/releases and create the new release Dont forget to attach install.sh." #TODO
