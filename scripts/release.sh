#!/usr/bin/env bash
# Sets and checks the version numbers a release carries in its files. See docs/release_process.md.
#
#   release.sh prepare VERSION   edits the files for VERSION, then runs check
#   release.sh check [VERSION]   lists every file that does not match VERSION (default: package.json)

set -euo pipefail

cd "$(dirname "$0")/.."

declare -r VERSION_PATTERN='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'
declare -r CHANGELOG=docs/CHANGELOG.md
declare -r NEXT_SQL=scripts/database/next.sql
declare -r PATCHES_DIR=scripts/database/patches.d
declare -r FULL_SQL=scripts/database/full.sql
declare -r DB_SCHEMA=backend/src/helper/DBSchema.class.php
declare -r NEXT_MIGRATION=scripts/migration/next.sh
declare -r CHART=scripts/helm/testcenter/Chart.yaml
declare -r HELM_INSTALLER=scripts/helm/helm-install-tc.sh
declare -r DOCS_VERSIONS=docs/site/public/versions.json

declare VERSION BASE MINOR

# Colors only for a terminal, and not with NO_COLOR set (https://no-color.org).
print_success() {
  if [[ -t 1 && -z ${NO_COLOR:-} ]]; then
    printf '\e[32m%s\e[0m\n' "$1"
  else
    printf '%s\n' "$1"
  fi
}

print_error() {
  if [[ -t 2 && -z ${NO_COLOR:-} ]]; then
    printf '\e[31m%s\e[0m\n' "$1" >&2
  else
    printf '%s\n' "$1" >&2
  fi
}

# File names and schema stamps never carry the pre-release suffix: 19.2.0-rc1 -> 19.2.0.
set_version() {
  if ! [[ $1 =~ $VERSION_PATTERN ]]; then
    print_error "Not a version: '$1'. Expected e.g. 19.2.0 or 19.2.0-rc1."
    exit 2
  fi
  VERSION=$1
  BASE=${VERSION%%-*}
  MINOR=${BASE%.*}
}

is_release() {
  [[ $VERSION == "$BASE" ]]
}

read_package_version() {
  sed -n 's/^  "version": "\(.*\)",$/\1/p' package.json
}

# The lock file holds the version twice: at the top and in the entry for the project itself, which npm
# always writes as the first entry of "packages".
read_lock_versions() {
  sed -n 's/^  "version": "\(.*\)",$/\1/p' package-lock.json
  grep -m1 '^      "version": ' package-lock.json | sed 's/^      "version": "\(.*\)",$/\1/'
}

read_changelog_heading() {
  grep -m1 '^# ' "$CHANGELOG" | sed 's/^# //'
}

read_full_sql_stamp() {
  sed -n "s/^VALUES ('dbSchemaVersion', '\([^']*\)', NULL);\$/\1/p" "$FULL_SQL"
}

read_required_schema_version() {
  sed -n "s/^  const REQUIRED_VERSION = '\([^']*\)';\$/\1/p" "$DB_SCHEMA"
}

read_newest_patch() {
  find "$PATCHES_DIR" -name '*.sql' | sed 's|.*/||; s|\.sql$||' | sort -V | tail -1
}

read_chart_value() {
  sed -n "s/^$1: //p" "$CHART"
}

read_installer_chart_version() {
  sed -n 's/^declare TESTCENTER_CHART_VERSION="\(.*\)"$/\1/p' "$HELM_INSTALLER"
}

# Works on a copy, so that a failing step leaves the file untouched.
edit_file() {
  declare file=$1
  shift
  "$@" < "$file" > "$file.tmp"
  cat "$file.tmp" > "$file"
  rm "$file.tmp"
}

prepare() {
  set_version "$1"

  # Refuses before editing anything, so that a refusal leaves no half-prepared release behind.
  if [[ -e $NEXT_SQL && -e $PATCHES_DIR/$BASE.sql ]]; then
    print_error "$NEXT_SQL and $PATCHES_DIR/$BASE.sql both exist. Merge next.sql into the patch by hand."
    exit 1
  fi
  if [[ -e $NEXT_MIGRATION && -e scripts/migration/$BASE.sh ]]; then
    print_error "$NEXT_MIGRATION and scripts/migration/$BASE.sh both exist. Merge them by hand."
    exit 1
  fi

  edit_file package.json sed "s/^  \"version\": \".*\",\$/  \"version\": \"$VERSION\",/"
  edit_file package-lock.json awk -v version="$VERSION" '
    /^  "version": "/ || (/^      "version": "/ && !project_done) {
      if (/^      /) project_done = 1
      sub(/"version": "[^"]*"/, "\"version\": \"" version "\"")
    }
    { print }'
  printf "package.json, package-lock.json: %s\n" "$VERSION"

  if [[ -e $NEXT_SQL ]]; then
    mv "$NEXT_SQL" "$PATCHES_DIR/$BASE.sql"
    edit_file "$FULL_SQL" sed "s/^VALUES ('dbSchemaVersion', '[^']*', NULL);\$/VALUES ('dbSchemaVersion', '$BASE', NULL);/"
    edit_file "$DB_SCHEMA" sed "s/^  const REQUIRED_VERSION = '[^']*';\$/  const REQUIRED_VERSION = '$BASE';/"
    printf "%s -> %s, schema version: %s\n" "$NEXT_SQL" "$PATCHES_DIR/$BASE.sql" "$BASE"
  fi

  if [[ -e $NEXT_MIGRATION ]]; then
    mv "$NEXT_MIGRATION" "scripts/migration/$BASE.sh"
    printf "%s -> scripts/migration/%s.sh\n" "$NEXT_MIGRATION" "$BASE"
  fi

  if [[ $(read_changelog_heading) == next ]]; then
    edit_file "$CHANGELOG" sed "s/^# next\$/# $BASE/"
    printf "%s: # %s\n" "$CHANGELOG" "$BASE"
  fi

  if is_release; then
    # The chart has to change with every new appVersion. Running prepare again keeps the version it set.
    if [[ $(read_chart_value appVersion) != "$BASE" ]]; then
      declare chart_version major minor
      chart_version=$(read_chart_value version)
      chart_version=${chart_version%%-*}
      major=${chart_version%%.*}
      minor=${chart_version#*.}
      minor=${minor%%.*}
      chart_version="$major.$((minor + 1)).0"
      edit_file "$CHART" sed "s/^appVersion: .*/appVersion: $BASE/; s/^version: .*/version: $chart_version/"
      edit_file "$HELM_INSTALLER" sed "s/^declare TESTCENTER_CHART_VERSION=\".*\"\$/declare TESTCENTER_CHART_VERSION=\"$chart_version\"/"
      printf "Helm chart: appVersion %s, version %s\n" "$BASE" "$chart_version"
      printf "  Raise the chart's major version instead if this release changes values.yaml in a way that breaks\n"
      printf "  existing values files (in %s and in %s).\n" "$CHART" "$HELM_INSTALLER"
    fi

    if ! grep -q "\"$MINOR\"" "$DOCS_VERSIONS"; then
      edit_file "$DOCS_VERSIONS" sed "s/^\[/[\"$MINOR\", /"
      printf "%s: added %s\n" "$DOCS_VERSIONS" "$MINOR"
    fi
  fi

  printf "\n"
  check "$VERSION"
}

check() {
  set_version "${1:-$(read_package_version)}"

  declare -a errors=()
  declare value

  value=$(read_package_version)
  [[ $value == "$VERSION" ]] || errors+=("package.json has version $value")

  while read -r value; do
    [[ $value == "$VERSION" ]] || errors+=("package-lock.json has version $value")
  done < <(read_lock_versions)

  value=$(read_changelog_heading)
  [[ $value == "$BASE" ]] || errors+=("$CHANGELOG starts with '# $value' instead of '# $BASE'")

  [[ ! -e $NEXT_SQL ]] || errors+=("$NEXT_SQL still exists")
  [[ ! -e $NEXT_MIGRATION ]] || errors+=("$NEXT_MIGRATION still exists")

  declare stamp required newest_patch
  stamp=$(read_full_sql_stamp)
  required=$(read_required_schema_version)
  newest_patch=$(read_newest_patch)
  [[ $stamp == "$required" ]] || errors+=("$FULL_SQL stamps schema $stamp, DBSchema::REQUIRED_VERSION is $required")
  [[ -z $newest_patch || $newest_patch == "$required" ]] ||
    errors+=("newest patch in $PATCHES_DIR is $newest_patch, DBSchema::REQUIRED_VERSION is $required")

  if is_release; then
    value=$(read_chart_value appVersion)
    [[ $value == "$BASE" ]] || errors+=("$CHART has appVersion $value")
    declare chart_version
    chart_version=$(read_chart_value version)
    value=$(read_installer_chart_version)
    [[ $value == "$chart_version" ]] ||
      errors+=("$HELM_INSTALLER installs chart $value, $CHART has version $chart_version")
    grep -q "\"$MINOR\"" "$DOCS_VERSIONS" || errors+=("$DOCS_VERSIONS does not list $MINOR")
  fi

  if (( ${#errors[@]} )); then
    print_error "Release $VERSION is not ready:"
    declare error
    for error in "${errors[@]}"; do
      print_error "  - $error"
    done
    exit 1
  fi
  print_success "Release $VERSION: all version numbers match."
}

case "${1:-}" in
  prepare)
    [[ $# == 2 ]] || { printf "Usage: %s prepare VERSION\n" "$0" >&2; exit 2; }
    prepare "$2"
    ;;
  check)
    [[ $# -le 2 ]] || { printf "Usage: %s check [VERSION]\n" "$0" >&2; exit 2; }
    check "${2:-}"
    ;;
  *)
    printf "Usage: %s prepare VERSION | check [VERSION]\n" "$0" >&2
    exit 2
    ;;
esac
