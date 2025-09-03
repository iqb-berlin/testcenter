#!/usr/bin/env bash

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
  # Rename 'Basic Network' to 'Ingress'
  sed -i.bak 's|^# Basic Network|# Ingress|' .env.prod && rm .env.prod.bak
  # Append 'HTTP_PORT' line after 'HOSTNAME' line
  sed -i.bak '/^HOSTNAME=.*/a \HTTP_PORT=80' .env.prod && rm .env.prod.bak
  # Rename 'TLS_PORT' to 'HTTPS_PORT'
  sed -i.bak 's|^TLS_PORT=|HTTPS_PORT=|' .env.prod && rm .env.prod.bak

  # Move 'TLS Certificates Resolvers' Block from last to second
  sed -i.bak '/^# TLS Certificates Resolvers.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^## Choose '', if you handle certificates manually, or.*/d" .env.prod && rm .env.prod.bak
  sed -i.bak "/^## choose 'acme', if.*/d" .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_CERTIFICATE_RESOLVER=.*/d" .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_CA_SERVER=.*/d" .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_EAB_KID=.*/d" .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_EAB_HMAC_ENCODED=.*/d" .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_EMAIL=.*/d" .env.prod && rm .env.prod.bak

  sed -i.bak '/^TLS_ENABLED=.*/a \\n# TLS Certificates Resolvers' .env.prod && rm .env.prod.bak
  sed -i.bak "/^# TLS Certificates Resolvers/a \## Choose '', if you handle certificates manually, or" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^## Choose '', if you handle certificates.*/a \## choose 'acme', if you want to use an ACME provider, like 'Let's Encrypt' or 'Sectigo'" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^## choose 'acme',.*/a TLS_CERTIFICATE_RESOLVER=${TLS_CERTIFICATE_RESOLVER}" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_CERTIFICATE_RESOLVER=.*/a TLS_ACME_CA_SERVER=${TLS_ACME_CA_SERVER}" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_CA_SERVER=.*/a TLS_ACME_EAB_KID=${TLS_ACME_EAB_KID}" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_EAB_KID=.*/a TLS_ACME_EAB_HMAC_ENCODED=${TLS_ACME_EAB_HMAC_ENCODED}" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^TLS_ACME_EAB_HMAC_ENCODED=.*/a TLS_ACME_EMAIL=${TLS_ACME_EMAIL}" \
    .env.prod && rm .env.prod.bak

  # Add new 'Images' block
  sed -i.bak '/^TLS_ACME_EMAIL=.*/a \\n# Images' .env.prod && rm .env.prod.bak
  ## Move 'DOCKERHUB_PROXY' to 'Images' Block
  sed -i.bak '/^## Dockerhub Proxy.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^DOCKERHUB_PROXY=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^# Images.*/a \## Dockerhub Proxy" .env.prod && rm .env.prod.bak
  sed -i.bak "/^## Dockerhub Proxy.*/a DOCKERHUB_PROXY=${DOCKERHUB_PROXY}" .env.prod && rm .env.prod.bak
  ## Move 'RESTART_POLICY' to 'Images' Block
  sed -i.bak '/^## Container Restart Policy.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^RESTART_POLICY=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^DOCKERHUB_PROXY=.*/a \## Container Restart Policy. Allowed values are: no, always (default), on-failure, unless-stopped" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^## Container Restart Policy.*/a RESTART_POLICY=${RESTART_POLICY}" .env.prod && rm .env.prod.bak
  sed -i.bak '/^RESTART_POLICY=.*/{N;s/\n$//}' .env.prod && rm .env.prod.bak

  # Revise Services Block
  ## Add 'Backend' Section
  sed -i.bak "/^# Services.*/a \## Backend" .env.prod && rm .env.prod.bak
  ## Move 'BROADCAST_SERVICE_ENABLED' line
  sed -i.bak '/^## Broadcasting Service.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^BROADCAST_SERVICE_ENABLED=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^## Backend/a BROADCAST_SERVICE_ENABLED=${BROADCAST_SERVICE_ENABLED}" .env.prod && rm .env.prod.bak
  ## Move 'FILE_SERVICE_ENABLED' line
  sed -i.bak '/^## File Service.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^FILE_SERVICE_ENABLED=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak "/^BROADCAST_SERVICE_ENABLED=.*/a FILE_SERVICE_ENABLED=${FILE_SERVICE_ENABLED}" \
    .env.prod && rm .env.prod.bak
  ## Move 'Cache Service' Block
  sed -i.bak '/^## Cache Service.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^### Allowed memory usage for cache in byte.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^CACHE_SERVICE_RAM=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^### Should whole files be cached or only authentication tokens.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^CACHE_SERVICE_INCLUDE_FILES=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^FILE_SERVICE_ENABLED=.*/a \\n### Cache Service' .env.prod && rm .env.prod.bak
  sed -i.bak "/^### Cache Service/a \#### Allowed memory usage for cache in byte. 2147483648 = 2GB. Default is 1GB." \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^#### Allowed memory usage for cache in byte.*/a CACHE_SERVICE_RAM=${CACHE_SERVICE_RAM}" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^CACHE_SERVICE_RAM=.*/a \#### Should whole files be cached or only authentication tokens" \
    .env.prod && rm .env.prod.bak
  sed -i.bak "/^#### Should whole files be cached.*/a CACHE_SERVICE_INCLUDE_FILES=${CACHE_SERVICE_INCLUDE_FILES}" \
    .env.prod && rm .env.prod.bak
  ## Move 'Security' Block
  sed -i.bak '/^# Security.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^PASSWORD_SALT=.*/d' .env.prod && rm .env.prod.bak
  sed -i.bak '/^CACHE_SERVICE_INCLUDE_FILES=.*/a \\n### Security' .env.prod && rm .env.prod.bak
  sed -i.bak "/^### Security/a PASSWORD_SALT=${PASSWORD_SALT}" .env.prod && rm .env.prod.bak
  sed -i.bak '/^PASSWORD_SALT=.*/a \\''' .env.prod && rm .env.prod.bak

  # Rename 'Database connection' comment
  sed -i.bak 's|^## Database connection.*|## Database|' .env.prod && rm .env.prod.bak
  sed -i.bak '/^MYSQL_PASSWORD=.*/,/^# Advanced Network.*/{/^$/d}' .env.prod && rm .env.prod.bak

  # Rename 'Advanced Network' comment
  sed -i.bak 's|^# Advanced Network.*|\n# Network|' .env.prod && rm .env.prod.bak
  sed -i.bak '/^DOCKER_DAEMON_MTU=.*/,${/^$/d}' .env.prod && rm .env.prod.bak
}

function main() {
  declare target_version="15.6.0"

  printf "Applying patch: %s ...\n" ${target_version}

  if check_version_gt_15.3.4; then

    # Migrate docker environment file
    migrate_env_file

    printf "Patch %s applied.\n" ${target_version}
  else
    printf "Patch %s skipped.\n" ${target_version}
  fi
}

source .env.prod

if [ -n "${1}" ]; then
  VERSION=${1}
fi

main
