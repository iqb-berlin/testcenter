#!/usr/bin/env bash

set -e

# The dev stack mounts backend/src, but composer's class map is built into the image. Regenerate it, so classes
# added or renamed since the build (e.g. after switching branches) are found.
# Composer and its home lie within open_basedir of local.php.ini; Xdebug only slows composer down.
COMPOSER_HOME=/tmp/composer XDEBUG_MODE=off \
  php /var/www/testcenter/tools/composer dump-autoload --quiet --no-interaction --ignore-platform-reqs

exec "$@"
