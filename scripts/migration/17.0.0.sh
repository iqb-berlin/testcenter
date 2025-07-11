#!/bin/bash

declare TARGET_VERSION="17.0.0"
declare APP_NAME='testcenter'
declare BACKUP_DIR="backup/temp"
declare BACKEND_SERVICE='testcenter-backend'
declare BACKEND_VOLUME='testcenter_backend_vo_data'
declare BACKEND_VOLUME_NEW='backend_vol'
declare BACKEND_VOLUME_DIR='/var/www/testcenter/data'
declare DB_SERVICE='testcenter-db'
declare DB_VOLUME='dbdata'
declare DB_VOLUME_NEW='db_vol'

declare PROJECT_NAME
PROJECT_NAME=$(basename "${PWD}")
declare BACKEND_VOLUME_NAME=${PROJECT_NAME}_${BACKEND_VOLUME}
declare DB_VOLUME_NAME=${PROJECT_NAME}_${DB_VOLUME}
declare BACKEND_VOLUME_NEW_NAME=${PROJECT_NAME}_${BACKEND_VOLUME_NEW}
declare DB_VOLUME_NEW_NAME=${PROJECT_NAME}_${DB_VOLUME_NEW}

data_services_up() {
  if ${TLS_ENABLED}; then
    docker compose \
        --progress quiet \
        --env-file "${PWD}/.env.prod" \
        --file "${PWD}/docker-compose.yml" \
        --file "${PWD}/docker-compose.prod.tls.yml" \
      up -d "${DB_SERVICE}" "${BACKEND_SERVICE}"
  else
    docker compose \
        --progress quiet \
        --env-file "${PWD}/.env.prod" \
        --file "${PWD}/docker-compose.yml" \
        --file "${PWD}/docker-compose.prod.yml" \
      up -d "${DB_SERVICE}" "${BACKEND_SERVICE}"
  fi
}

dump_db() {
  declare db_container_name="${DB_SERVICE}"
  declare db_name="${MYSQL_DATABASE}" # see docker environment file!
  declare db_dump_file="${BACKUP_DIR}/${db_name}.sql"

  if ${TLS_ENABLED}; then
    docker compose \
        --env-file "${PWD}/.env.prod" \
        --file "${PWD}/docker-compose.yml" \
        --file "${PWD}/docker-compose.prod.tls.yml" \
      exec "${db_container_name}" \
        mysqldump \
          --add-drop-database \
          --user=root \
          --password="${MYSQL_ROOT_PASSWORD}" \
          --databases "${db_name}" \
      2>/dev/null \
      >"${PWD}/${db_dump_file}"
  else
    docker compose \
        --env-file "${PWD}/.env.prod" \
        --file "${PWD}/docker-compose.yml" \
        --file "${PWD}/docker-compose.prod.yml" \
      exec "${db_container_name}" \
        mysqldump \
          --add-drop-database \
          --user=root \
          --password="${MYSQL_ROOT_PASSWORD}" \
          --databases "${db_name}" \
      2>/dev/null \
      >"${PWD}/${db_dump_file}"
  fi

  if test $? -eq 0; then
    printf -- "        - Current db dump has been saved at: '%s'\n" "${db_dump_file}"
  else
    printf -- "        - Current db dump was not successful!\n\n"
    printf "    '%s' migration script finished with error.\n\n" "${APP_NAME}"

    exit 1
  fi
}

export_backend_volume() {
  declare backend_container_name="${BACKEND_SERVICE}"

  docker run \
      --rm \
      --volumes-from "${backend_container_name}" \
      --volume "${PWD}/${BACKUP_DIR}":/tmp \
    busybox \
      tar czf "/tmp/${BACKEND_VOLUME}.tar.gz" "${BACKEND_VOLUME_DIR}" &>/dev/null

  if test ${?} -eq 0; then
    declare backup_file="${BACKUP_DIR}/${BACKEND_VOLUME}.tar.gz"
    printf -- "        - Current '%s' volume has been saved at: '%s'\n" "${BACKEND_VOLUME_NAME}" "${backup_file}"
  else
    printf -- "        - Current '%s' backup was not successful!\n\n" "${BACKEND_VOLUME_NAME}"
    printf "    '%s' migration script finished with error.\n\n" "${APP_NAME}"

    exit 1
  fi
}

create_data_backup() {
  printf "      Create data backup ...\n"

  printf "        Dumping '%s' DB and exporting backend data files (this may take a while) ...\n" "${APP_NAME}"
  dump_db
  export_backend_volume
  printf "        DB dumped and backend data files exported.\n"

  printf "      Data backup creation done.\n\n"
}

create_new_volumes() {
  # Create volumes external, but declare them 'created by docker compose'
  # https://github.com/docker/compose/issues/10087

  printf "      Create new data volumes ...\n"
  data_services_down
  sed -i.bak "s|testcenter_backend_vo_data|backend_vol|" \
    docker-compose.yml docker-compose.prod.yml docker-compose.prod.tls.yml && \
    rm docker-compose.yml.bak docker-compose.prod.yml.bak docker-compose.prod.tls.yml.bak
  sed -i.bak "s|dbdata|db_vol|" docker-compose.yml docker-compose.prod.yml docker-compose.prod.tls.yml && \
    rm docker-compose.yml.bak docker-compose.prod.yml.bak docker-compose.prod.tls.yml.bak
  data_services_up
  printf "      New data volume creations done.\n\n"
}

restore_db(){
  declare db_backend_container_name="${DB_SERVICE}"
  declare db_name="${MYSQL_DATABASE}" # see docker environment file!
  declare db_dump_file="${BACKUP_DIR}/${db_name}.sql"

  if ${TLS_ENABLED}; then
    docker compose \
        --env-file "${PWD}/.env.prod" \
        --file "${PWD}/docker-compose.yml" \
        --file "${PWD}/docker-compose.prod.tls.yml" \
      exec -T "${db_backend_container_name}" \
        mysql \
          --user=root \
          --password="${MYSQL_ROOT_PASSWORD}" \
      2>/dev/null \
      <"${PWD}/${db_dump_file}"
  else
    docker compose \
        --env-file "${PWD}/.env.prod" \
        --file "${PWD}/docker-compose.yml" \
        --file "${PWD}/docker-compose.prod.yml" \
      exec -T "${db_backend_container_name}" \
        mysql \
          --user=root \
          --password="${MYSQL_ROOT_PASSWORD}" \
      2>/dev/null \
      <"${PWD}/${db_dump_file}"
  fi

  if test $? -eq 0; then
    printf -- "        - Current db dump has been restored in volume '%s'\n" "${DB_VOLUME_NEW_NAME}"
  else
    printf -- "        - Current db volume migration was not successful!\n\n"
    printf "    '%s' migration script finished with error.\n\n" "${APP_NAME}"

    exit 1
  fi
}

import_backend_volume() {
  declare backend_container_name="${BACKEND_SERVICE}"

  docker run \
      --rm \
      --volumes-from "${backend_container_name}" \
      --volume "${PWD}/${BACKUP_DIR}":/tmp \
		busybox \
			  sh -c "cd ${BACKEND_VOLUME_DIR} && tar xzf /tmp/${BACKEND_VOLUME}.tar.gz --strip-components 4" \
			&>/dev/null

  if test ${?} -eq 0; then
    printf -- "        - Current backend volume backup has been imported into volume '%s'\n" "${BACKEND_VOLUME_NEW_NAME}"
  else
    printf -- "        - Current backend volume migration was not successful!\n\n"
    printf "    '%s' migration script finished with error.\n\n" "${APP_NAME}"

    exit 1
  fi
}

restore_data_backup() {
  printf "      Restore data backup ...\n"

  printf "        Restoring '%s' DB and exporting backend data files (this may take a while) ...\n" "${APP_NAME}"
  restore_db
  import_backend_volume
  printf "        DB restored and backend data files imported.\n"

  printf "      Data backup restoration done.\n\n"
}

data_services_down() {
  if ${TLS_ENABLED}; then
    docker compose \
      --progress quiet \
      --env-file "${PWD}/.env.prod" \
      --file "${PWD}/docker-compose.yml" \
      --file "${PWD}/docker-compose.prod.tls.yml" \
      down
  else
    docker compose \
      --progress quiet \
      --env-file "${PWD}/.env.prod" \
      --file "${PWD}/docker-compose.yml" \
      --file "${PWD}/docker-compose.prod.yml" \
      down
  fi
}

delete_old_volumes(){
  printf "      Deleting old data volumes ...\n"
  printf -- "      - DB volume '%s' deleted.\n" "$(docker volume rm "${DB_VOLUME_NAME}")"
  printf -- "      - Backend volume '%s' deleted.\n" "$(docker volume rm "${BACKEND_VOLUME_NAME}")"
  printf "      Old data volume deletions done.\n\n"
}

migrate_volume_names() {
  data_services_up
  create_data_backup
  create_new_volumes
  restore_data_backup
  data_services_down
  delete_old_volumes
}

migrate_env_file() {
  printf "      Migrate environment file '.env.prod' ...\n"

  # Move 'Security' Block
  sed -i.bak '/^### Security.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^PASSWORD_SALT=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^FILE_SERVICE_ENABLED=.*/a PASSWORD_SALT=${PASSWORD_SALT}" .env.prod && rm .env.prod.bak

  # Reorder 'Cache Service'
  sed -i.bak "s|^### Cache Service.*|## Cache Service|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^#### Allowed memory.*|### Allowed memory usage for cache in byte. 2147483648 = 2GB. Default is 1GB.|" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "s|^#### Should whole files.*|### Should whole files be cached or only authentication tokens|" \
    .env.prod && rm .env.prod.bak

  # Rename 'Cache Service' environment variables
  sed -i.bak "s|^CACHE_SERVICE_RAM=|REDIS_MEMORY_MAX=|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^CACHE_SERVICE_INCLUDE_FILES=|REDIS_CACHE_FILES=|" .env.prod && rm .env.prod.bak

  # Delete empty line after 'Cache Service' block
  sed -i.bak '/^REDIS_CACHE_FILES=.*/{N;s/\n$//}' .env.prod && rm .env.prod.bak

  # Add Password Authentication for 'Cache Service'
  REDIS_PASSWORD=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
  sed -i.bak "/^## Cache Service/a REDIS_PASSWORD=${REDIS_PASSWORD}" .env.prod && rm .env.prod.bak
  printf "      Environment file migration done.\n\n"

  # rename to broadcaster and file-server
  sed -i.bak "s|^BROADCAST_SERVICE_ENABLED=|BROADCASTER_ENABLED=|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^FILE_SERVICE_ENABLED=|FILE_SERVER_ENABLED=|" .env.prod && rm .env.prod.bak
}

migrate_make_testcenter_update_cmd() {
  printf "      Update 'make testcenter update' command in file '%s' ...\n" "scripts/make/${APP_NAME}.mk"

  if ! grep -q ".sh -s \$(VERSION)" scripts/make/${APP_NAME}.mk; then
    sed -i.bak "s|scripts/update_${APP_NAME}.sh|scripts/update_${APP_NAME}.sh -s \$(VERSION)|" \
      "${PWD}/scripts/make/${APP_NAME}.mk" && rm "${PWD}/scripts/make/${APP_NAME}.mk.bak"
  fi

  printf "      'make testcenter update' command update done.\n\n"
}

main() {
  source .env.prod

  printf "    Applying patch: %s ...\n" ${TARGET_VERSION}

  # Migrate db and backend volume names
  migrate_volume_names

  # Migrate docker environment file
  migrate_env_file

  # Migrate make command 'testcenter-update'
  migrate_make_testcenter_update_cmd

  printf "    Patch %s applied.\n" ${TARGET_VERSION}
}

main
