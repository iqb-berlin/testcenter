#!/bin/bash
source .env

echo "Applying patch: 15.0.0"

echo -e "FILE_SERVICE_ENABLED=true" >> .env
echo -e "CACHE_SERVICE_RAM=1073741824" >> .env
echo -e "CACHE_SERVICE_INCLUDE_FILES=off" >> .env

sed -i /^MYSQL_SALT=/d .env
if [ -z "$PASSWORD_SALT" ]; then
  echo -e "PASSWORD_SALT=t" >> .env
fi
