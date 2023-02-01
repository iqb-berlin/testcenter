#!/bin/bash

sed -i 's/- \"--providers.file.directory=\//- \"--providers.file.filename=\/ssl-config.yml\n      - \"--entrypoints.websecure.http.tls.options=default@file\"/' docker-compose.prod.tls.yml
echo "Switched to new ssl-config file"

sed -i 's/TLS=off/TLS_ENABLED=no/' .env
sed -i 's/TLS=on/TLS_ENABLED=yes/' .env
sed -i '/BROADCAST_SERVICE_URI_PUSH/d' .env
sed -i '/BROADCAST_SERVICE_URI_SUBSCRIBE/d' .env
echo "Updated Broadcast-Service settings in .env"

echo "Patch done"
