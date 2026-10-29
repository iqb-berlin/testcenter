#!/usr/bin/env bash

# Migration for the removal of `DOCKER_DAEMON_MTU`.
#
# The MTU of the Docker network is no longer set by the Compose files. A value set there overrode
# the host-wide default of the Docker daemon ('default-network-opts' in '/etc/docker/daemon.json'),
# so the network had an MTU of 1500 unless every installation repeated the host value. This script
# removes the obsolete key and its block from an existing '.env.prod'. If the key held a value other
# than 1500, the operator relied on it, so the script points to the daemon setting that replaces it.
#
# 'scripts/updater.sh' runs this script from the installation directory, in the backup phase,
# after the installation directory and the data backup have been created. It evaluates the exit
# status, so a failed step must not exit with 0.

declare TARGET_VERSION='19.1.0'
declare ENV_FILE='.env.prod'

declare HAS_ERRORS=false

fail() {
  printf -- "      - ERROR: %s\n" "${1}"

  HAS_ERRORS=true
}

migrate_env_file() {
  printf "      Remove MTU setting from '%s' ...\n" "${ENV_FILE}"

  if [ ! -f "${ENV_FILE}" ]; then
    fail "'${ENV_FILE}' does not exist in '${PWD}'."
    printf "\n"

    return 0
  fi

  if ! grep -q '^DOCKER_DAEMON_MTU=' "${ENV_FILE}"; then
    printf "      MTU setting removal done.\n\n"

    return 0
  fi

  declare mtu
  mtu=$(grep '^DOCKER_DAEMON_MTU=' "${ENV_FILE}" | cut -d '=' -f 2 | tr -d "\"' ")

  # The key was the only entry of the '# Network' block, so the block header, its comment and the
  # blank line before it go as well. '-i.bak' plus 'rm' keeps this working with GNU and BSD sed.
  if sed -i.bak -e '/^## MTU Setting\./d' -e '/^DOCKER_DAEMON_MTU=/d' "${ENV_FILE}" &&
    sed -i.bak -e '/^$/{N;/^\n# Network$/d;}' -e '/^# Network$/d' "${ENV_FILE}"; then
    rm -f "${ENV_FILE}.bak"
    printf -- "      - 'DOCKER_DAEMON_MTU' removed.\n"
  else
    fail "'DOCKER_DAEMON_MTU' could not be removed from '${ENV_FILE}'."
  fi

  if [ -n "${mtu}" ] && [ "${mtu}" != '1500' ]; then
    printf -- "      - WARNING: 'DOCKER_DAEMON_MTU' was set to %s and has no effect any more.\n" "${mtu}"
    printf -- "        Set the MTU for all Docker networks of this host in '/etc/docker/daemon.json':\n"
    printf -- "          \"default-network-opts\": { \"bridge\": { \"com.docker.network.driver.mtu\": \"%s\" } }\n" \
      "${mtu}"
    printf -- "        Then restart Docker. Without it the network uses an MTU of 1500, and connections can\n"
    printf -- "        stall if the network of the host has a smaller MTU.\n"
  fi

  printf "      MTU setting removal done.\n\n"
}

main() {
  printf "    Applying patch: %s ...\n" "${TARGET_VERSION}"

  migrate_env_file

  if ${HAS_ERRORS}; then
    printf "    Patch %s applied with errors.\n" "${TARGET_VERSION}"

    exit 1
  fi

  printf "    Patch %s applied.\n" "${TARGET_VERSION}"
}

main
