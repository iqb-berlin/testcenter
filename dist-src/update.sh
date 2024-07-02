#!/bin/bash

REPO_URL=iqb-berlin/testcenter

create_backup() {
  local backup_dir="backup/$(date '+%Y-%m-%d')"
  mkdir -p $backup_dir
  tar -cf - --exclude='./backup' . | tar -xf - -C $backup_dir
  printf "Backup created. Files have been moved to: %s\n" $backup_dir
}

apply_patches() {
  wget -nv -O patch-list.json "https://scm.cms.hu-berlin.de/api/v4/projects/6099/repository/tree?path=dist-src/patches&ref=master"
  grep -oP '"name":".+?"' patch-list.json | cut -d':' -f 2 | tr -d '"' > patch-list.txt
  while read p; do
    echo "checking if patch $p is applicable"
    if [[ $(echo -e "$VERSION\n$p" | sort -V | head -n1) == "$VERSION" && "$p" != "$VERSION" ]]; then
      # TODO ignore patches which are too new
      wget -nv -O $p "https://scm.cms.hu-berlin.de/api/v4/projects/6099/repository/files/dist-src%2Fpatches%2F${p}/raw?ref=master"
      bash ${p}
      rm ${p}
    fi
  done < patch-list.txt
  rm patch-list.json
  rm patch-list.txt
}

create_backup

source .env
printf "Installed version: $VERSION\n"

latest_version_tag=$(curl -s https://api.github.com/repos/$REPO_URL/releases/latest | grep tag_name | cut -d : -f 2,3 | tr -d \" | tr -d , | tr -d " " )
printf "Latest available version: $latest_version_tag\n"

if [ $VERSION = $latest_version_tag ]; then
  echo "Latest version is already installed."
  exit 0
fi

if [[ $(echo -e "$VERSION\n$latest_version_tag" | sort -V | head -n1) == "$latest_version_tag" ]]; then
  echo -e "Your version is newer than the latest release. Check your .env file.\nExiting..."
  exit 0
fi

sed -i "s#VERSION=.*#VERSION=$latest_version_tag#" .env

apply_patches

echo "Update applied"
