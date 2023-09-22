#!/bin/bash
# Rename SSL-config file
## rename intermediate to old version if present
if [ -f config/ssl-config.yml ]; then
  mv config/ssl-config.yml config/cert_config.yml 2>/dev/null
  sed -i 's/options:/options_backup:/' config/cert_config.yml
fi

if [ ! -f config/tls-config.yml ]; then
  read -p "SSL config file will be renamed and additional TLS settings will be added. This may overwrite customizations. \
  Certificate paths are untouched.
Refer to the Documentation and Changelog if you want to do this change manually.
Continue with this step? [y/N]:" -r -n 1 -e CONTINUE
  if [[ $CONTINUE =~ [yY] ]]
    then
      mv config/cert_config.yml config/tls-config.yml 2>/dev/null
      sed -i 's/tls:/tls: \
  options: \
    default: \
      minVersion: VersionTLS12 \
      cipherSuites: \
        - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 \
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 \
        - TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256 \
        - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 \
        - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 \
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384/' config/tls-config.yml
  fi
fi


source .env

# include mySQL-config
REPO_URL=iqb-berlin/testcenter
wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/scripts/database/my.cnf
chmod 444 config/my.cnf

echo "Update .env-file"

sed -i 's/TLS=off/TLS_ENABLED=no/' .env
sed -i 's/TLS=on/TLS_ENABLED=yes/' .env

if [ -n "$BROADCAST_SERVICE_URI_PUSH" ]; then
  sed -i '/BROADCAST_SERVICE_URI_PUSH/d' .env
  sed -i '/BROADCAST_SERVICE_URI_SUBSCRIBE/d' .env
  echo "BROADCAST_SERVICE_ENABLED=on" >> .env
else
  sed -i '/BROADCAST_SERVICE_URI_PUSH/d' .env
  sed -i '/BROADCAST_SERVICE_URI_SUBSCRIBE/d' .env
  echo "BROADCAST_SERVICE_ENABLED=off" >> .env
fi

# 15.0.0: include new setting
echo "FILE_SERVICE_ENABLED=true" >> .env

echo "Patch done"
