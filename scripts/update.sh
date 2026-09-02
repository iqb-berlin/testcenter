#!/usr/bin/env bash
set -e

# This is a small, version-independent bootstrap script, analogous to scripts/install.sh. Its only
# job is to figure out which release the user wants to update to and then download + run the
# matching scripts/updater.sh, which contains the actual update logic - TWICE:
#
#   1. once downloaded from the currently INSTALLED (source) release, to run the backup and
#      migration-script steps - these have to use logic that matches what is actually deployed
#      right now (e.g. current docker-compose file names, service names, ...).
#   2. once downloaded from the selected TARGET release, to run the remaining steps (downloading
#      new files, updating settings, restarting the application) - these have to use logic that
#      matches what is being installed.
#
# Rationale: like install.sh, this keeps the bootstrap logic itself stable across releases, so it
# never needs to update/replace itself. The actual update logic lives entirely in scripts/updater.sh
# and is always downloaded fresh for whichever release it needs to match.

declare APP_NAME='testcenter'
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/${APP_NAME}"
declare REPO_API="https://api.github.com/repos/iqb-berlin/${APP_NAME}"

declare UPDATE_OPTION
declare SOURCE_VERSION
declare TARGET_VERSION

check_version_tag_exists() {
  declare tag="${1}"
  declare status_code

  status_code=$(curl --silent --write-out "%{response_code}\n" --output /dev/null "${REPO_API}/releases/tags/${tag}")

  [ "${status_code}" = "200" ]
}

get_latest_release() {
  curl -s -f "${REPO_API}"/releases/latest |
    grep tag_name |
    cut -d : -f 2,3 |
    tr -d \" |
    tr -d , |
    tr -d " "
}

resolve_target_version() {
  # A target version was already given on the command line (e.g. for scripted/non-interactive use)
  # - just validate it and skip the interactive prompt below.
  if [ -n "${TARGET_VERSION}" ]; then
    if ! check_version_tag_exists "${TARGET_VERSION}"; then
      printf "This target release tag does not exist.\n"
      exit 1
    fi

    return
  fi

  declare latest_release
  latest_release=$(get_latest_release)

  printf "Installed version: %s\n" "${SOURCE_VERSION}"
  printf "Latest available release: %s\n\n" "${latest_release}"

  if [ "${SOURCE_VERSION}" = "${latest_release}" ]; then
    printf "Latest release is already installed!\n"
    declare is_continue
    read -p "Continue anyway? [y/N] " -er -n 1 is_continue

    if ! [[ ${is_continue} =~ ^[yY]$ ]]; then
      printf "'%s' update script finished.\n\n" "${APP_NAME}"
      exit 0
    fi

    printf "\n"
  fi

  while read -p 'Name the desired version: ' -er -i "${latest_release}" TARGET_VERSION; do
    if check_version_tag_exists "${TARGET_VERSION}"; then
      printf "\n"
      break
    fi

    printf "This version tag does not exist.\n"
  done
}

download_updater() {
  if ! curl -s -f -o "${2}" "${REPO_URL}/${1}/scripts/updater.sh"; then
    return 1
  fi

  chmod +x "${2}"
}

# Runs the backup and migration-script steps, using the updater matching the INSTALLED release, so
# that backup logic (docker compose file names, service names, ...) matches what is actually
# deployed. Releases predating this bootstrap/updater split don't have scripts/updater.sh at all -
# in that (one-time, transitional) case we can't run this automatically and ask for a manual backup
# instead.
run_backup_phase() {
  declare source_updater="updater_${APP_NAME}_source.sh"

  if ! download_updater "${SOURCE_VERSION}" "${source_updater}"; then
    printf "Note: the installed release '%s' does not provide 'scripts/updater.sh' (it predates\n" "${SOURCE_VERSION}"
    printf "the current update tooling), so backups and migration scripts can not be run\n"
    printf "automatically for this update.\n\n"

    printf "Please create a manual backup of your installation directory and database now.\n\n"

    declare is_continue
    read -p "Continue? [y/N] " -er -n 1 is_continue

    if ! [[ ${is_continue} =~ ^[yY]$ ]]; then
      printf "\n'%s' update script finished.\n\n" "${APP_NAME}"
      exit 0
    fi

    printf "\n"

    return
  fi

  bash "${source_updater}" -s "${SOURCE_VERSION}" -t "${TARGET_VERSION}" -p backup
  declare exit_code=$?
  rm -f "${source_updater}"

  if [ ${exit_code} -ne 0 ]; then
    exit ${exit_code}
  fi
}

# Runs the remaining update steps (file downloads, settings, restart), using the updater matching
# the TARGET release, so that this logic matches what is being installed.
run_apply_phase() {
  declare target_updater="updater_${APP_NAME}_target.sh"

  if ! download_updater "${TARGET_VERSION}" "${target_updater}"; then
    printf "Download of updater for release '%s' failed.\n" "${TARGET_VERSION}"
    printf "'%s' update script finished with error.\n\n" "${APP_NAME}"
    exit 1
  fi

  bash "${target_updater}" -s "${SOURCE_VERSION}" -t "${TARGET_VERSION}" -p apply
  declare exit_code=$?
  rm -f "${target_updater}"

  exit ${exit_code}
}

main() {
  if [ -z "${TARGET_VERSION}" ]; then
    printf "\n==================================================\n"
    printf "'%s' update script started ..." "${APP_NAME}" | tr '[:lower:]' '[:upper:]'
    printf "\n==================================================\n"
    printf "\n"
    printf "[1] Update '%s' application\n" "${APP_NAME}"
    printf "[2] Exit update script\n\n"

    declare choice
    while read -p 'What do you want to do? [1/2] ' -er -n 1 choice; do
      if [ "${choice}" = 1 ]; then
        printf "\n=== UPDATE '%s' application ===\n\n" "${APP_NAME}"
        break
      elif [ "${choice}" = 2 ]; then
        printf "'%s' update script finished.\n\n" "${APP_NAME}"
        exit 0
      fi
    done
  fi

  resolve_target_version

  run_backup_phase
  run_apply_phase
}

display_usage() {
  printf "Usage: %s <-s source_release> [-t <target_release>]\n" "${0}"
  printf "Try '%s -h' for more information.\n\n" "${0}"

  exit 1
}

display_help() {
  printf "Usage: %s <-s source_release> [-t <target_release>]\n\n" "${0}"
  printf "Options:\n"
  printf "  -s  Specify the current source release tag to be updated from.\n"
  printf "  -t  Specify the upcoming target release tag to be updated to (skips the interactive\n"
  printf "      prompt).\n"
  printf "  -h  Display this help information.\n\n"

  exit 0
}

while getopts s:t:h UPDATE_OPTION; do
  case "${UPDATE_OPTION}" in
  s)
    if check_version_tag_exists "${OPTARG}"; then
      SOURCE_VERSION="${OPTARG}"
    else
      printf "This source release tag does not exist.\n"
      exit 1
    fi
    ;;
  t)
    TARGET_VERSION="${OPTARG}"
    ;;
  h)
    display_help
    ;;
  \?)
    display_usage
    ;;
  esac
done
shift $((OPTIND - 1))

if [ -z "${SOURCE_VERSION}" ]; then
  printf "Error: '-s' or '-h' option is required.\n\n"
  display_usage
fi

main
