#!/usr/bin/env bash

set -e

# file-rights
chown -R www-data:www-data /var/www/testcenter/data
chown -R www-data:www-data /var/www/testcenter/backend/config

# run server
apache2-foreground