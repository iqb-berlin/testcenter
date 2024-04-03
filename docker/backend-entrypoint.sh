#!/usr/bin/env bash

set -e

# init data
php /var/www/backend/initialize.php

# file-rights
chown -R www-data:www-data /var/www/data

# keep container open
apache2-foreground