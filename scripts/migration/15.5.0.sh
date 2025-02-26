#!/bin/bash

function check_version_gt_15.3.4() {
  declare prerelease_regex="^(0|([1-9][0-9]*))\.(0|([1-9][0-9]*))\.(0|([1-9][0-9]*))(-((alpha|beta|rc)((\.)?([1-9][0-9]*))?))$"
  declare release_regex="^((0|([1-9][0-9]*)))\.((0|([1-9][0-9]*)))\.((0|([1-9][0-9]*)))$"

  if ! [[ "$VERSION" =~ $prerelease_regex || "$VERSION" =~ $release_regex ]]; then
    return 1
  else
    declare normalized_version="$VERSION"

    if [[ "$VERSION" =~ $prerelease_regex ]]; then
      normalized_version=$(printf '%s' "$VERSION" | cut -d'-' -f1)
    fi

    # Check VERSION is less or equal than 15.3.4
    if printf '%s\n%s' "$normalized_version" 15.3.4 | sort -C -V; then
      return 1
    else
      return 0
    fi
  fi
}

function migrate_env_file() {
  if ! grep -q "# Basic Network" .env.prod; then
    sed -i.bak '/^HOSTNAME=.*/i # Basic Network' .env.prod && rm .env.prod.bak
  fi
  sed -i.bak '/^PORT=80/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^TLS_PORT=.*/{N;s/\n$//}' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^TLS_ENABLED=on|TLS_ENABLED=true|' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^TLS_ENABLED=yes|TLS_ENABLED=true|' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^TLS_ENABLED=off|TLS_ENABLED=false|' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^TLS_ENABLED=no|TLS_ENABLED=false|' .env.prod && rm .env.prod.bak
  if ! grep -q "# Security" .env.prod; then
    sed -i.bak '/^PASSWORD_SALT=.*/d' .env.prod && rm .env.prod.bak
    sed -i.bak '/^TLS_ENABLED=.*/a \\n# Security' .env.prod && rm .env.prod.bak
    sed -i.bak "/^# Security/a PASSWORD_SALT=${PASSWORD_SALT}" .env.prod && rm .env.prod.bak
  fi
  if ! grep -q "# Services" .env.prod; then
    sed -i.bak '/^MYSQL_ROOT_PASSWORD=.*/i # Services' .env.prod && rm .env.prod.bak
  fi
  if ! grep -q "## Database connection" .env.prod; then
    sed -i.bak '/^MYSQL_ROOT_PASSWORD=.*/i ## Database connection' .env.prod && rm .env.prod.bak
  fi
  sed -i.bak '/^SUPERUSER_NAME=super/d' .env.prod && rm .env.prod.bak
  if grep -q "SUPERUSER_PASSWORD=user123" .env.prod; then
    sed -i.bak '/^SUPERUSER_PASSWORD=.*/{N;s/\n$//}' .env.prod && rm .env.prod.bak
    sed -i.bak '/^SUPERUSER_PASSWORD=user123/d' .env.prod && rm .env.prod.bak
  fi
  if ! grep -q "## Broadcasting Service" .env.prod; then
    sed -i.bak '/^BROADCAST_SERVICE_ENABLED=.*/i ## Broadcasting Service' .env.prod && rm .env.prod.bak
  fi
  if ! grep -q "## File Service" .env.prod; then
    sed -i.bak '/^FILE_SERVICE_ENABLED=.*/i \\''' .env.prod && rm .env.prod.bak
    sed -i.bak '/^FILE_SERVICE_ENABLED=.*/i ## File Service' .env.prod && rm .env.prod.bak
  fi
  if ! grep -q "## Cache Service" .env.prod; then
    sed -i.bak '/^CACHE_SERVICE_RAM=.*/i \\''' .env.prod && rm .env.prod.bak
    sed -i.bak '/^CACHE_SERVICE_RAM=.*/i ## Cache Service' .env.prod && rm .env.prod.bak
    sed -i.bak '/^CACHE_SERVICE_RAM=.*/i ### Allowed memory usage for cache in byte. 2147483648 = 2GB. Default is 1GB.' .env.prod && rm .env.prod.bak
  fi
  sed -i.bak '/^CACHE_SERVICE_RAM=.*/a \\''' .env.prod && rm .env.prod.bak

  sed -i.bak 's|authentification|authentication|g' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^CACHE_SERVICE_INCLUDE_FILES=on|CACHE_SERVICE_INCLUDE_FILES=true|' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^CACHE_SERVICE_INCLUDE_FILES=yes|CACHE_SERVICE_INCLUDE_FILES=true|' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^CACHE_SERVICE_INCLUDE_FILES=off|CACHE_SERVICE_INCLUDE_FILES=false|' .env.prod && rm .env.prod.bak
  sed -i.bak 's|^CACHE_SERVICE_INCLUDE_FILES=no|CACHE_SERVICE_INCLUDE_FILES=false|' .env.prod && rm .env.prod.bak
  if ! grep -q "### Should whole files be cached or only authentication tokens" .env.prod; then
    sed -i.bak '/^CACHE_SERVICE_INCLUDE_FILES=.*/i ### Should whole files be cached or only authentication tokens' .env.prod && rm .env.prod.bak
    sed -i.bak '/^CACHE_SERVICE_INCLUDE_FILES=.*/a \\''' .env.prod && rm .env.prod.bak
  fi

  if ! grep -q "DOCKER_DAEMON_MTU" .env.prod; then
    {
      printf "# Advanced Network\n"
      printf "## MTU Setting. Default is 1500, but Openstack actually uses 1442\n"
      printf "DOCKER_DAEMON_MTU=1500\n\n"
    } >>.env.prod
  fi

  if ! grep -q "DOCKERHUB_PROXY" .env.prod; then
    {
      printf "## Dockerhub Proxy\n"
      printf "DOCKERHUB_PROXY=\n"
    } >>.env.prod
  fi
  sed -i.bak "s|^DOCKERHUB_PROXY=''|DOCKERHUB_PROXY=|" .env.prod && rm .env.prod.bak
  sed -i.bak '/^DOCKERHUB_PROXY=.*/a \\''' .env.prod && rm .env.prod.bak

  sed -i.bak 's|allowed values are: no (default), always,|Allowed values are: no, always (default),|' \
    .env.prod && rm .env.prod.bak
  if ! grep -q "RESTART_POLICY" .env.prod; then
    {
      printf "## Container Restart Policy. Allowed values are: no, always (default), on-failure, unless-stopped\n"
      printf "RESTART_POLICY=always\n"
    } >>.env.prod
  fi
  sed -i.bak '/^RESTART_POLICY=.*/a \\''' .env.prod && rm .env.prod.bak

  # Append TLS configuration settings to docker environment file
  {
    printf "# TLS Certificates Resolvers\n"
    printf "## Choose '', if you handle certificates manually, or\n"
    printf "## choose 'acme', if you want to use an ACME provider, like 'Let's Encrypt' or 'Sectigo'\n"
    printf "TLS_CERTIFICATE_RESOLVER=\n"
    printf "TLS_ACME_CA_SERVER=https://acme-v02.api.letsencrypt.org/directory\n"
    printf "TLS_ACME_EAB_KID=\n"
    printf "TLS_ACME_EAB_HMAC_ENCODED=\n"
    printf "TLS_ACME_EMAIL=admin.name@organisation.org\n"
  } >>.env.prod
  sed -i.bak "s|^## choose 'acme', if you want to use an acme-provider.*|## choose 'acme', if you want to use an ACME provider, like 'Let's Encrypt' or 'Sectigo'|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^TLS_ACME_EAB_KID=''|TLS_ACME_EAB_KID=|" .env.prod && rm .env.prod.bak
  sed -i.bak "s|^TLS_ACME_EAB_HMAC_ENCODED=''|TLS_ACME_EAB_HMAC_ENCODED=|" .env.prod && rm .env.prod.bak
}

function main() {
  declare target_version="15.5.0"

  printf "Applying patch: %s ...\n" ${target_version}

  if check_version_gt_15.3.4; then

    # Clean up version 15.3.0 migration file issue
    if [ -f scripts/make/testcenter.mk.bak ]; then
      rm scripts/make/testcenter.mk.bak
    fi

    # Delete old and now unused configuration files
    if [ -f config/my.cnf ]; then
      rm config/my.cnf
    fi
    if [ -f config/nginx.conf ]; then
      rm config/nginx.conf
    fi

    # Backup original obsolete 'traefik' tls configuration file
    if [ -f config/traefik/tls-config.yml_bkp ]; then
      mv config/traefik/tls-config.yml_bkp config/traefik/tls-config.yml.old
    fi
    # Backup updated obsolete 'traefik' tls configuration file
    if [ -f config/traefik/tls-config.yml ]; then
      mv config/traefik/tls-config.yml config/traefik/tls-config.yml.old
    fi

    # Retype certificate and private_key files to indicate full chain certificate usage
    if [ -f secrets/traefik/certs/certificate.crt ]; then
      mv secrets/traefik/certs/certificate.crt secrets/traefik/certs/certificate.pem
    fi
    if [ -f secrets/traefik/certs/private_key.key ]; then
      mv secrets/traefik/certs/private_key.key secrets/traefik/certs/private_key.pem
    fi

    # Rename ACME provider 'letsencrypt' directory for general usage
    if [ -d secrets/traefik/certs/letsencrypt ]; then
      if rmdir secrets/traefik/certs/acme/ &>/dev/null; then
        mv secrets/traefik/certs/letsencrypt secrets/traefik/certs/acme
      fi
    fi

    # Migrate docker environment file
    migrate_env_file

    printf "Patch %s applied.\n" ${target_version}
  else
    printf "Patch %s skipped.\n" ${target_version}
  fi
}

source .env.prod

if [ -n "$1" ]; then
  VERSION=$1
fi

main
