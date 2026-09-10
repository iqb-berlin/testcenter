#!/usr/bin/env bash

set -e

php /var/www/testcenter/backend/check-db-compatibility.php

apache2-foreground
