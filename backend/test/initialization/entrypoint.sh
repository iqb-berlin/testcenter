#!/usr/bin/env bash

set -euo pipefail

readonly DATABASE_SOURCE_DIR="/var/www/testcenter/scripts/database-source"
readonly DATABASE_WORK_DIR="/var/www/testcenter/scripts/database"

# The initialization suite deliberately adds and removes patch files. Prepare a
# private working copy so those fixtures never depend on host UID/GID mappings
# and never leave generated SQL files in the developer's checkout.
#
# The target is a narrowly scoped anonymous Docker volume declared by the test
# compose file. Clearing it here also prevents database scripts baked into an
# older local backend image from leaking into the current test run.
find "$DATABASE_WORK_DIR" -mindepth 1 -delete
cp -R "$DATABASE_SOURCE_DIR/." "$DATABASE_WORK_DIR/"

# Replace this setup process with the requested test so Docker Compose observes
# the test's real exit code for --exit-code-from.
cd /var/www/testcenter
exec bash "backend/test/initialization/tests/${TEST_NAME:-fallback}.sh"
