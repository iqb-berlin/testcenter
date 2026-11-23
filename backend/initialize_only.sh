#!/usr/bin/env bash

set -e

# Optional parameters based on environment variables
params=""

if [ "$OVERWRITE_INSTALLATION" = "true" ]; then
  params+=" --overwrite_existing_installation"
fi

if [ "$SKIP_DB_INTEGRITY" = "true" ]; then
  params+=" --skip_db_integrity_check"
fi

if [ "$SKIP_READ_FILES" = "true" ]; then
  params+=" --skip_read_workspace_files"
fi

if [ "$NO_SAMPLE_DATA" = "true" ]; then
  params+=" --dont_create_sample_data"
fi

# init data with conditions based on environment variables
php /var/www/testcenter/backend/initialize.php $params
