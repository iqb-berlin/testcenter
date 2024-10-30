#!/bin/bash
source .env
REPO_URL=iqb-berlin/testcenter/14.11.0

echo "Applying patch: 14.11"

# Rename SSL-config file
if [ -f config/ssl-config.yml ]; then
  mv config/ssl-config.yml config/tls-config.yml
fi
if [ -f config/cert_config.yml ]; then
  mv config/cert_config.yml config/tls-config.yml
fi

if [ -f config/tls-config.yml ]; then
  # Save cert file names and insert them in the downloaded file
  certs=$(grep -A 3 certificates config/tls-config.yml)
  wget -nv -O config/tls-config.yml https://raw.githubusercontent.com/${REPO_URL}/dist-src/tls-config.yml
  printf "$(head -n 11 config/tls-config.yml)\n$(echo "$certs")\n" > config/tls-config.yml
else
  # if no cert config present, just download file
  wget -nv -O config/tls-config.yml https://raw.githubusercontent.com/${REPO_URL}/dist-src/tls-config.yml
fi

# Delete outdated config lines
if [ -n "$BROADCAST_SERVICE_URI_PUSH" ]; then
  sed -i '/BROADCAST_SERVICE_URI_PUSH/d' .env
  sed -i '/BROADCAST_SERVICE_URI_SUBSCRIBE/d' .env
  echo "BROADCAST_SERVICE_ENABLED=true" >> .env
fi

# Add MySQL config
if [ -f config/my.cnf ]; then
  wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/scripts/database/my.cnf
  chmod 444 config/my.cnf
fi

# Redo Docker-Compose setup
rm docker-compose.prod.tls.yml
sed -i '/TLS=/d' .env
sed -i '/TLS_ENABLED=/d' .env
mkdir -p config/certs

# re-download Makefile which has been changed wrongly by the updater
wget -nv -O Makefile https://raw.githubusercontent.com/${REPO_URL}/dist-src/Makefile