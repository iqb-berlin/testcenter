#!/bin/bash

sed -i 's/- \"--providers.file.directory=\//- \"--providers.file.filename=\/ssl-config.yml\n      - \"--entrypoints.websecure.http.tls.options=default@file\"/' docker-compose.prod.tls.yml
echo "Switched to new ssl-config file"

echo "Patch done"
