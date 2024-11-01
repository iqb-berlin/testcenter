#!/bin/bash
source .env

declare TARGET_VERSION="15.4.0"

printf "Applying patch: %s ...\n" ${TARGET_VERSION}

# Retype certificate and private_key files to indicate full chain certificate usage
if [ -f secrets/traefik/certs/certificate.crt ]; then
  mv secrets/traefik/certs/certificate.crt secrets/traefik/certs/certificate.pem
fi
if [ -f secrets/traefik/certs/private_key.key ]; then
  mv secrets/traefik/certs/private_key.key secrets/traefik/certs/private_key.pem
fi

# Rename acme-provider 'letsencrypt' directory for general usage
if [ -d /secrets/traefik/certs/letsencrypt ]; then
  mv /secrets/traefik/certs/letsencrypt /secrets/traefik/certs/acme
fi

# Enrich docker environment file with
{
  printf "\n"
  printf "# TLS Certificates Resolvers\n"
  printf "## Choose '', if you handle certificates manually, or\n"
  printf "## choose 'acme', if you want to use an acme-provider, like 'letsencrypt' or 'sectigo'\n"
  printf "TLS_CERTIFICATE_RESOLVER=\n"
  printf "TLS_ACME_CA_SERVER=https://acme-v02.api.letsencrypt.org/directory\n"
  printf "TLS_ACME_EAB_KID=''\n"
  printf "TLS_ACME_EAB_HMAC_ENCODED=''\n"
  printf "TLS_ACME_EMAIL=admin.name@organisation.org\n"
  printf "\n"
} >>.env.prod

printf "Patch %s applied.\n" ${TARGET_VERSION}
