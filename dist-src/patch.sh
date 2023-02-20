#!/bin/bash

# Rename SSL-config file
mv config/cert_config.yml config/ssl-config.yml 2>/dev/null

# include mySQL-config
REPO_URL=iqb-berlin/testcenter
source .env
wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/scripts/database/my.cnf

echo "Patch done"
