#!/usr/bin/env bash
set -e

# This is a small, version-independent bootstrap script. Its only job is to figure out which
# release the user wants to install and then download + run the *matching* installer for that
# exact release (scripts/installer.sh), which contains the actual installation logic.

declare APP_NAME='testcenter'

declare SELECTED_VERSION=$1
declare REPO_URL="https://raw.githubusercontent.com/iqb-berlin/$APP_NAME"
declare REPO_API="https://api.github.com/repos/iqb-berlin/$APP_NAME"

declare TARGET_TAG

# Checks whether a given tag corresponds to an actual GitHub release (as opposed to e.g. a typo).
check_version_tag_exists() {
  declare tag="$1"
  declare status_code

  status_code=$(curl --silent --write-out "%{response_code}\n" --output /dev/null "$REPO_API/releases/tags/$tag")

  [ "$status_code" = "200" ]
}

get_latest_release() {
  curl -s -f "$REPO_API"/releases/latest |
    grep tag_name |
    cut -d : -f 2,3 |
    tr -d \" |
    tr -d , |
    tr -d " "
}

resolve_target_tag() {
  # A version was already given on the command line (e.g. for scripted/non-interactive use) -
  # just validate it and skip the interactive prompt below.
  if [ -n "$SELECTED_VERSION" ]; then
    if ! check_version_tag_exists "$SELECTED_VERSION"; then
      printf "'%s' is not a valid release tag.\n" "$SELECTED_VERSION"
      exit 1
    fi

    TARGET_TAG="$SELECTED_VERSION"

    return
  fi

  declare latest_release
  latest_release=$(get_latest_release)

  while read -p 'Please name the desired release tag: ' -er -i "$latest_release" TARGET_TAG; do
    if check_version_tag_exists "$TARGET_TAG"; then
      break
    fi

    printf "This version tag does not exist.\n"
  done

  printf "\n"
}

# Downloads the installer matching the selected release and hands off execution to it.
download_and_run_installer() {
  declare installer_file="installer_${APP_NAME}.sh"

  if ! curl -s -f -o "$installer_file" "$REPO_URL/$TARGET_TAG/scripts/installer.sh"; then
    printf "Download of installer for release '%s' failed.\n" "$TARGET_TAG"
    printf "'%s' installation script finished with error.\n" "$APP_NAME"
    exit 1
  fi
  chmod +x "$installer_file"

  bash "$installer_file" "$TARGET_TAG"
  declare exit_code=$?

  rm -f "$installer_file"

  exit $exit_code
}

main() {
  printf "\n==================================================\n"
  printf "'%s' installation script started ..." "$APP_NAME" | tr '[:lower:]' '[:upper:]'
  printf "\n==================================================\n"
  printf "\n"

  resolve_target_tag

  download_and_run_installer
}

main
