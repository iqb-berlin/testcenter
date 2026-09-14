#!/usr/bin/env bash

# Migration for the switch from MySQL to PostgreSQL.
#
# The public database configuration no longer uses the `MYSQL_*` names. This script renames the
# affected keys in an existing '.env.prod' and removes the two keys that have no PostgreSQL
# counterpart. Without it an update leaves the old names behind, and the backend starts without
# any database configuration.
#
# 'scripts/updater.sh' runs this script from the installation directory, in the backup phase,
# after the installation directory and the data backup have been created. It evaluates the exit
# status, so a failed step must not exit with 0.

declare TARGET_VERSION='next'
declare ENV_FILE='.env.prod'

declare HAS_ERRORS=false

fail() {
  printf -- "      - ERROR: %s\n" "${1}"

  HAS_ERRORS=true
}

# Deletes an obsolete key together with its value. Does nothing if the key is absent.
remove_env_variable() {
  declare name="${1}"

  if ! grep -q "^${name}=" "${ENV_FILE}"; then
    return 0
  fi

  # '-i.bak' plus 'rm' keeps this working with both GNU and BSD sed, like the other migrations.
  if sed -i.bak "/^${name}=/d" "${ENV_FILE}"; then
    rm -f "${ENV_FILE}.bak"
    printf -- "      - '%s' removed.\n" "${name}"
  else
    fail "'${name}' could not be removed from '${ENV_FILE}'."
  fi
}

# Renames a key and keeps its value. Does nothing if the old key is absent, so a second run of
# this script changes nothing.
rename_env_variable() {
  declare old_name="${1}"
  declare new_name="${2}"

  if ! grep -q "^${old_name}=" "${ENV_FILE}"; then
    return 0
  fi

  # Both names present: the new name already holds the value the application uses, so the obsolete
  # line is only dropped. This happens when an operator did the rename by hand before the update.
  if grep -q "^${new_name}=" "${ENV_FILE}"; then
    printf -- "      - '%s' already exists.\n" "${new_name}"
    remove_env_variable "${old_name}"

    return 0
  fi

  if sed -i.bak "s|^${old_name}=|${new_name}=|" "${ENV_FILE}"; then
    rm -f "${ENV_FILE}.bak"
    printf -- "      - '%s' renamed to '%s'.\n" "${old_name}" "${new_name}"
  else
    fail "'${old_name}' could not be renamed to '${new_name}' in '${ENV_FILE}'."
  fi
}

migrate_env_file() {
  printf "      Migrate database configuration in '%s' ...\n" "${ENV_FILE}"

  if [ ! -f "${ENV_FILE}" ]; then
    fail "'${ENV_FILE}' does not exist in '${PWD}'."
    printf "\n"

    return 0
  fi

  rename_env_variable 'MYSQL_DATABASE' 'DB_DATABASE'
  rename_env_variable 'MYSQL_USER' 'DB_USER'
  rename_env_variable 'MYSQL_PASSWORD' 'DB_PASSWORD'

  # Host and port were never part of '.env.prod-template', and docker-compose.yml passes them to
  # the backend as literals ('DB_HOST: db', 'DB_PORT: 5432'), so an entry in '.env.prod' has no
  # effect on a Compose installation. An installation can still have added them by hand, so they
  # are renamed to keep the file consistent. A carried-over MySQL port value stays meaningless.
  rename_env_variable 'MYSQL_HOST' 'DB_HOST'
  rename_env_variable 'MYSQL_PORT' 'DB_PORT'

  # No replacement: the PostgreSQL setup uses no separate root account, and PostgreSQL has no
  # MySQL binary log whose retention could be configured.
  remove_env_variable 'MYSQL_ROOT_PASSWORD'
  remove_env_variable 'MYSQL_BINLOG_EXPIRE_LOGS_SECONDS'

  printf "      Database configuration migration done.\n\n"
}

# The backend cannot connect at all when one of the three required keys is missing or empty, and
# the database container would be initialized with an incomplete configuration. Such a state must
# be reported as an error instead of a successful migration.
verify_env_file() {
  printf "      Verify database configuration in '%s' ...\n" "${ENV_FILE}"

  if [ ! -f "${ENV_FILE}" ]; then
    printf "      Database configuration verification skipped.\n\n"

    return 0
  fi

  declare name
  for name in 'DB_DATABASE' 'DB_USER' 'DB_PASSWORD'; do
    # '=.' requires at least one character after the '=', so an empty value counts as missing.
    if grep -q "^${name}=." "${ENV_FILE}"; then
      continue
    fi

    fail "'${name}' is missing or empty. Add it to '${ENV_FILE}' before you start the application."
  done

  # Any other 'MYSQL_*' key is a leftover of a custom configuration. It is harmless, but it can
  # mislead the next reader of the file, so it is worth a hint.
  declare leftovers
  leftovers=$(grep -o '^MYSQL_[A-Z_]*' "${ENV_FILE}" | tr '\n' ' ')
  if [ -n "${leftovers}" ]; then
    printf -- "      - WARNING: obsolete keys are still present: %s\n" "${leftovers}"
    printf -- "        They have no effect any more and can be deleted.\n"
  fi

  printf "      Database configuration verification done.\n\n"
}

main() {
  printf "    Applying patch: %s ...\n" "${TARGET_VERSION}"

  migrate_env_file
  verify_env_file

  if ${HAS_ERRORS}; then
    printf "    Patch %s applied with errors.\n" "${TARGET_VERSION}"

    exit 1
  fi

  printf "    Patch %s applied.\n" "${TARGET_VERSION}"
}

main
