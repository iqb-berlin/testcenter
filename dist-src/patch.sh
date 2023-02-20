#!/bin/bash

# switch to new ssl-config file
sed -i 's/- \"--providers.file.directory=\//- \"--providers.file.filename=\/ssl-config.yml\n      - \"--entrypoints.websecure.http.tls.options=default@file\"/' docker-compose.prod.tls.yml
echo "Switched to new ssl-config file"


# include mySQL-config
REPO_URL=iqb-berlin/testcenter
source .env
wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/scripts/database/my.cnf

echo "Patch done"
