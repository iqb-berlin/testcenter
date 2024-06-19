#!/bin/bash

APP_NAME='testcenter'

REPO_URL="https://raw.githubusercontent.com/iqb-berlin/$APP_NAME"
REPO_API="https://api.github.com/repos/iqb-berlin/$APP_NAME"
HAS_ENV_FILE_UPDATE=false
HAS_CONFIG_FILE_UPDATE=false


load_environment_variables() {
  # Load current environment variables in .env.studio-lite
  source .env
  SOURCE_TAG=$VERSION
}

get_new_release_version() {

  LATEST_RELEASE=$(curl -s "$REPO_API"/releases/latest |
    grep tag_name |
    cut -d : -f 2,3 |
    tr -d \" |
    tr -d , |
    tr -d " ")

  if [ "$SOURCE_TAG" = "latest" ]; then
    SOURCE_TAG="$LATEST_RELEASE"
  fi

  printf "Installed version: %s\n" "$SOURCE_TAG"
  printf "Latest available release: %s\n\n" "$LATEST_RELEASE"

  if [ "$SOURCE_TAG" = "$LATEST_RELEASE" ]; then
    printf "Latest release is already installed!\n"
    read -p "Continue anyway? [Y/n] " -er -n 1 CONTINUE

    if [[ $CONTINUE =~ ^[nN]$ ]]; then
      printf "'%s' update script finished.\n" $APP_NAME
      exit 0
    fi

    printf "\n"
  fi

  while read -p '1. Name the desired version: ' -er -i "${LATEST_RELEASE}" TARGET_TAG; do
    if ! curl --head --silent --fail --output /dev/null $REPO_URL/"$TARGET_TAG"/README.md 2>/dev/null; then
      printf "This version tag does not exist.\n"

    else
      printf "\n"
      break
    fi

  done
}

create_backup() {
  local backup_dir="backup/$(date '+%Y-%m-%d')"
  mkdir -p $backup_dir
  tar -cf - --exclude='./backup' . | tar -xf - -C $backup_dir
  printf "Backup created. Files have been moved to: %s\n" $backup_dir
}


prepare_installation_dir() {
  mkdir -p backup/release/
  mkdir -p backup/database_dump
  mkdir -p config/frontend
  mkdir -p scripts/make
  mkdir -p scripts/migration
}

download_file() {
  if wget -q -O "$1" $REPO_URL/"$TARGET_TAG"/"$2"; then
    printf -- "- File '%s' successfully downloaded.\n" "$1"
  else
    printf -- "- File '%s' download failed.\n\n" "$1"
    printf "'%s' update script finished with error.\n" $APP_NAME
    exit 1
  fi
}

update_files() {
  printf "4. File download\n"

  download_file docker-compose.prod.yml dist-src/docker-compose.prod.yml
  download_file docker-compose.prod.tls.yml dist-src/docker-compose.prod.tls.yml
  download_file Makefile dist-src/Makefile
  download_file config/tls-config.yml dist-src/tls-config.yml
  download_file config/nginx.conf frontend/config/nginx.conf

  printf "File download done.\n\n"
}

get_modified_file() {
  SOURCE_FILE="$1"
  TARGET_FILE=$REPO_URL/"$TARGET_TAG"/dist-src/"$2"
  FILE_TYPE="$3"
  CURRENT_ENV_FILE=.env

  if [ ! -f "$SOURCE_FILE" ] || ! (curl --stderr /dev/null "$TARGET_FILE" | diff -q - "$SOURCE_FILE" &>/dev/null); then

    # no source file exists anymore
    if [ ! -f "$SOURCE_FILE" ]; then
      if [ "$FILE_TYPE" == "env-file" ]; then
        printf -- "- Environment template file '%s' does not exist anymore.\n" "$SOURCE_FILE"
        printf "  A version %s environment template file will be downloaded now ...\n" "$TARGET_TAG"
        printf "  Please compare your current environment file with the new template file and update it "
        printf "with new environment variables, or delete obsolete variables, if necessary.\n"
        printf "  For comparison use e.g. 'diff %s %s'.\n" $CURRENT_ENV_FILE "$SOURCE_FILE"
      fi

    # source file and target file differ
    elif ! curl --stderr /dev/null "$TARGET_FILE" | diff -q - "$SOURCE_FILE" &>/dev/null; then
      if [ "$FILE_TYPE" == "env-file" ]; then
        printf -- "- The current environment template file '%s' is outdated.\n" "$SOURCE_FILE"
        printf "  A version %s environment template file will be downloaded now ...\n" "$TARGET_TAG"
        printf "  Please compare your current environment file with the new template file and update it "
        printf "with new environment variables, or delete obsolete variables, if necessary.\n"
        printf "  For comparison use e.g. 'diff %s %s'.\n" $CURRENT_ENV_FILE "$SOURCE_FILE"
      fi


    fi

    if wget -q -O "$SOURCE_FILE" "$TARGET_FILE"; then
      printf "  File '%s' was downloaded successfully.\n" "$SOURCE_FILE"

      if [ "$FILE_TYPE" == "env-file" ]; then
        HAS_ENV_FILE_UPDATE=true
      fi

    else
      printf "  File '%s' download failed.\n\n" "$SOURCE_FILE"
      printf "'%s' update script finished with error.\n" $APP_NAME
      exit 1

    fi

  else
    if [ "$FILE_TYPE" == "env-file" ]; then
      printf -- "- The current environment template file '%s' is still up to date.\n" "$SOURCE_FILE"
    fi
  fi
}

check_environment_file_modifications() {
  # check environment file
  printf "5. Environment template file modification check\n"
  get_modified_file .env.template .env "env-file"
  printf "Environment template file modification check done.\n\n"
}

apply_patches() {
  wget -nv -O patch-list.json "https://scm.cms.hu-berlin.de/api/v4/projects/6099/repository/tree?path=dist-src/patches&ref=master"
  grep -oP '"name":".+?"' patch-list.json | cut -d':' -f 2 | tr -d '"' > patch-list.txt
  while read p; do
    echo "$p"
    if [[ $(echo -e "$VERSION\n$p" | sort -V | head -n1) != "$VERSION" ]]; then
      # TODO ignore patches which are too new
      wget -nv -O $p "https://scm.cms.hu-berlin.de/api/v4/projects/6099/repository/files/dist-src%2Fpatches%2F${p}/raw?ref=master"
      bash ${p}
      rm ${p}
    fi
  done < patch-list.txt
  rm patch-list.json
  rm patch-list.txt

  sed -i "s#VERSION=.*#VERSION=$TARGET_TAG#" .env

}

finalize_update() {
  printf "8. Summary\n"
  if [ $HAS_ENV_FILE_UPDATE == "true" ] || [ $HAS_CONFIG_FILE_UPDATE == "true" ]; then
    if [ $HAS_ENV_FILE_UPDATE == "true" ]; then
      printf -- '- Version and environment update applied!\n\n'
      printf "  PLEASE CHECK YOUR ENVIRONMENT FILE FOR MODIFICATIONS ! ! !\n\n"
    fi
    printf "Summary done.\n\n\n"

    if [[ $(docker compose --project-name "${PWD##*/}" ps -q) ]]; then
      printf "'%s' application will now shut down ...\n" $APP_NAME
      docker compose --project-name "${PWD##*/}" down
    fi

    printf "When your files are checked for modification, you could restart the application with "
    printf "make run at the command line to put the update into effect.\n\n"

    printf "'%s' update script finished.\n" $APP_NAME
    exit 0

  else
    printf -- "- Version update applied.\n"
    printf "  No further action needed.\n"
    printf "Summary done.\n\n\n"

    application_restart
  fi
}

application_restart() {
  if command make -v >/dev/null 2>&1; then
    read -p "Do you want to restart $APP_NAME now? [Y/n] " -er -n 1 RESTART

    if [[ ! $RESTART =~ [nN] ]]; then
      make down
      make run-detached
    else
      printf "'%s' update script finished.\n" $APP_NAME
      exit 0
    fi

  else
    printf 'You can restart the docker services now.\n\n'
    printf "'%s' update script finished.\n" $APP_NAME
    exit 0
  fi
}

main() {
  printf "\n==================================================\n"
  printf '%s update script started ...' $APP_NAME | tr '[:lower:]' '[:upper:]'
  printf "\n==================================================\n"
  printf "\n"


  load_environment_variables
  get_new_release_version
  create_backup
  prepare_installation_dir
  update_files
  check_environment_file_modifications
  apply_patches
  finalize_update
}

main
