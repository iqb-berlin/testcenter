#!/bin/bash
source .env
REPO_URL=iqb-berlin/testcenter

echo "Applying patch: 15.1.0"

# Change base compose file for 'www-fix'
wget -nv -O docker-compose.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/docker/docker-compose.yml

# Change compose file for non-tls setup
wget -nv -O docker-compose.prod.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.yml

# Download additional compose file
wget -nv -O docker-compose.prod.tls.yml https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/docker-compose.prod.tls.yml

# Change Makefile for non-tls setup
wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/dist-src/Makefile

# TLS is optional again
if [ -z "$TLS_ENABLED" ]; then
  echo -e "TLS_ENABLED=yes" >> .env
fi