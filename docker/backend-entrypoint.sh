#!/usr/bin/env bash

set -e

php /var/www/backend/initialize.php

apache2-foreground
