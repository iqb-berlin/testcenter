#!/usr/bin/env bash

declare TESTCENTER_VERSION="17.4.0"
declare TESTCENTER_CHART_VERSION="2.4.0"
declare TRAEFIK_VERSION="v3.6.0"
declare TRAEFIK_CHART_VERSION="37.3.0"
declare TRAEFIK_CRDS_CHART_VERSION="1.12.0"
declare LONGHORN_VERSION="v1.9.0"
declare REQUIRED_PACKAGES=("kubectl version" "kubectl cluster-info" "helm version")

declare LONGHORN_ENABLED=false
declare TRAEFIK_ENABLED=false

declare -A TRAEFIK_ENV_VARS
TRAEFIK_ENV_VARS[TESTCENTER_BASE_DOMAIN]=testcenter.domain.tld
TRAEFIK_ENV_VARS[HTTP_PORT]=80
TRAEFIK_ENV_VARS[HTTPS_PORT]=443
TRAEFIK_ENV_VARS[TLS_ENABLED]=true
declare TRAEFIK_ENV_VAR_ORDER=(TESTCENTER_BASE_DOMAIN HTTP_PORT HTTPS_PORT TLS_ENABLED)

declare -A TESTCENTER_ENV_VARS
TESTCENTER_ENV_VARS[REDIS_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
TESTCENTER_ENV_VARS[MYSQL_ROOT_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
TESTCENTER_ENV_VARS[MYSQL_USER]=iqb_tba_db_user
TESTCENTER_ENV_VARS[MYSQL_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
TESTCENTER_ENV_VARS[MYSQL_SALT]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 5 | head -n 1)
declare TESTCENTER_ENV_VAR_ORDER=(REDIS_PASSWORD MYSQL_ROOT_PASSWORD MYSQL_USER MYSQL_PASSWORD MYSQL_SALT)

check_prerequisites() {
  printf "\nChecking required packages ...\n"
  declare req_package

  for req_package in "${REQUIRED_PACKAGES[@]}"; do

    if ${req_package} >/dev/null 2>&1; then
      printf -- "- '%s' is working.\n" "${req_package}"

    else
      printf "'%s' does not seem to work, please install the corresponding package before running the script! \n\n" \
        "${req_package}"
      printf 'Install script finished with error.\n'
      exit 1
    fi

  done

  printf "Checking required packages done.\n\n"
}

install_longhorn() {
  declare continue
  read -rep "Do you want to install 'Longhorn ${LONGHORN_VERSION}'? [Y/n] " -n 1 continue

  if ! [[ ${continue} =~ ^[nN]$ ]]; then
    printf "Installing 'Longhorn' in the 'longhorn-system' namespace ...\n"
    helm repo add longhorn https://charts.longhorn.io --force-update

    if ! helm install longhorn longhorn/longhorn \
      --namespace longhorn-system \
      --create-namespace \
      --version ${LONGHORN_VERSION}; then

      printf "\n'Longhorn %s' installation failed.\n" ${LONGHORN_VERSION}
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue

      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Install script finished with error.\n\n'
        exit 1
      fi

    else
      printf "'Longhorn' installation done.\n"
      LONGHORN_ENABLED=true
    fi

    printf "\n"
  fi
}

install_traefik() {
  declare continue
  read -rep "Do you want to install 'Traefik ${TRAEFIK_VERSION}'? [Y/n] " -n 1 continue

  if ! [[ ${continue} =~ ^[nN]$ ]]; then

    printf "Download Traefik default deployment configuration (traefik-values.yaml) for customization ...\n"
    helm repo add traefik https://traefik.github.io/charts --force-update
    helm show values traefik/traefik --version ${TRAEFIK_CHART_VERSION} > traefik-values.yaml
    printf "Traefik default deployment configuration download done.\n\n"

    if ${LONGHORN_ENABLED}; then
      printf "Configure Traefik for 'longhorn persistent volumes' ...\n"
      # Locate the persistence: occurence in traefik-values.yaml, scan downward until the enabled: flag is found, and flip whatever value was present (true or false) to true
      sed -i.bak '/^persistence:$/{:persistence; $!N; /enabled: \(true\|false\)$/! b persistence; s//enabled: true/}'\
        traefik-values.yaml && rm traefik-values.yaml.bak
      sed -i.bak "s|accessMode:.*|accessMode: ReadWriteMany|" traefik-values.yaml && rm traefik-values.yaml.bak
      sed -i.bak "s|storageClass:.*|storageClass: longhorn|" traefik-values.yaml && rm traefik-values.yaml.bak
      printf "Traefik configuration for 'longhorn persistent volumes' done (q.v. traefik-values.yaml).\n\n"
    fi

    printf "Configure Traefik Ingress for Testcenter ...\n"
    declare traefik_env_var_name

    for traefik_env_var_name in "${TRAEFIK_ENV_VAR_ORDER[@]}"; do
      declare traefik_env_var_value
      read -p "${traefik_env_var_name}: " -er -i "${TRAEFIK_ENV_VARS[${traefik_env_var_name}]}" traefik_env_var_value
      TRAEFIK_ENV_VARS[${traefik_env_var_name}]=${traefik_env_var_value}
    done

    # ingressRoute.dashboard
    sed -i.bak "s|PathPrefix(\`/dashboard\`).*|Host(\`traefik.${TRAEFIK_ENV_VARS[TESTCENTER_BASE_DOMAIN]}\`)|" \
      traefik-values.yaml && rm traefik-values.yaml.bak

    # globalArguments
    sed -i.bak "s|--global.checknewversion|--global.checknewversion=false|" \
      traefik-values.yaml && rm traefik-values.yaml.bak
    sed -i.bak "s|--global.sendanonymoususage|--global.sendanonymoususage=false|" \
      traefik-values.yaml && rm traefik-values.yaml.bak

    # ports
    declare is_tls_enabled=${TRAEFIK_ENV_VARS[TLS_ENABLED]}

    ## web
    sed -i.bak "s|exposedPort: 80|exposedPort: ${TRAEFIK_ENV_VARS[HTTP_PORT]}|" \
      traefik-values.yaml && rm traefik-values.yaml.bak
    if ${is_tls_enabled}; then
      sed -i.bak "s|entryPoint: {}|entryPoint:\n        to: websecure\n        scheme: https|" \
        traefik-values.yaml && rm traefik-values.yaml.bak
    fi

    ## websecure
    sed -i.bak "s|exposedPort: 443|exposedPort: ${TRAEFIK_ENV_VARS[HTTPS_PORT]}|" \
      traefik-values.yaml && rm traefik-values.yaml.bak

    ### tls
    sed -i.bak '/^  websecure:$/{
    :websecure
    $!N
    /tls:$/! b websecure
    {
    :tls
    $!N
    /enabled: \(true\|false\)$/! b tls
    s//enabled: '"$is_tls_enabled"'/
    }
    }' traefik-values.yaml && rm traefik-values.yaml.bak

    # tlsOptions
    declare tls_options
    tls_options="tlsOptions:\n"
    tls_options+="  default:\n"
    tls_options+="    sniStrict: false # set false to use self-signed certificates\n"
    tls_options+="    cipherSuites:\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_RC4_128_SHA\n"
    tls_options+="      - TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256\n"
    tls_options+="      - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\n"
    tls_options+="      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\n"
    tls_options+="      - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256\n"
    tls_options+="    minVersion: VersionTLS12\n"

    if ${is_tls_enabled}; then
      sed -i.bak "s|tlsOptions: {}|$tls_options|" traefik-values.yaml && rm traefik-values.yaml.bak
    fi
    printf "Traefik Ingress configuration for Testcenter done (q.v. traefik-values.yaml).\n\n"

    printf "Installing 'Traefik' Ingress Controller in the 'kube-system' namespace ...\n"
    printf -- "-> 'Install Traefik-CRDs' ...\n"
    if ! helm install traefik-crds traefik/traefik-crds \
      --namespace kube-system \
      --version ${TRAEFIK_CRDS_CHART_VERSION}; then

      printf "\n-> 'Traefik-CRDs' installation failed.\n"
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue

      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Install script finished with error.\n\n'
        exit 1
      fi

    else
      printf -- "-> 'Traefik-CRD' installation done.\n"
    fi

    printf "\n-> 'Install Traefik' ...\n"
    if ! helm install traefik traefik/traefik \
      --namespace kube-system \
      --values traefik-values.yaml \
      --skip-crds \
      --version ${TRAEFIK_CHART_VERSION}; then

      printf "\n-> 'Traefik %s' installation failed.\n" ${TRAEFIK_VERSION}
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue

      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Install script finished with error.\n\n'
        exit 1

      else
        printf "'Traefik %s' Ingress Controller installation failed.\n\n" ${TRAEFIK_VERSION}
        return
      fi

    else
      printf -- "-> 'Traefik' installation done.\n"
      TRAEFIK_ENABLED=true
    fi

    printf "\n'Traefik %s' Ingress Controller installation done.\n\n" ${TRAEFIK_VERSION}
  fi
}

install_testcenter() {
  declare continue
  read -rep "Do you want to install 'Testcenter ${TESTCENTER_VERSION}'? [Y/n] " -n 1 continue

  if ! [[ ${continue} =~ ^[nN]$ ]]; then
    printf "Download Testcenter default deployment configuration (testcenter-values.yaml) for customization ...\n"
    helm show values oci://registry-1.docker.io/iqbberlin/testcenter --version ${TESTCENTER_CHART_VERSION} > testcenter-values.yaml
    printf "Testcenter default deployment configuration download done.\n\n"

    if ${LONGHORN_ENABLED}; then
      printf "Configure Testcenter 'testcenter-values' for 'longhorn persistent volumes' ...\n"
      sed -i.bak "s|longhornEnabled:.*|longhornEnabled: true|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      sed -i.bak "s|backendPvcStorageClassName:.*|backendPvcStorageClassName: longhorn|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      sed -i.bak "s|backendPvcAccessMode:.*|backendPvcAccessMode: ReadWriteMany|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      sed -i.bak "s|backendConfigPvcStorageClassName:.*|backendConfigPvcStorageClassName: longhorn|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      sed -i.bak "s|backendConfigPvcAccessMode:.*|backendConfigPvcAccessMode: ReadWriteMany|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      sed -i.bak "s|dbPvcStorageClassName:.*|dbPvcStorageClassName: longhorn-single|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      sed -i.bak "s|dbPvcAccessMode:.*|dbPvcAccessMode: ReadWriteOnce|" \
        testcenter-values.yaml && rm testcenter-values.yaml.bak
      printf "Testcenter 'testcenter-values' configuration for 'longhorn persistent volumes' done (q.v. testcenter-values.yaml).\n\n"
    fi

    printf "Customize Testcenter default configuration ...\n"
    if ${TRAEFIK_ENABLED}; then
      sed -i.bak "s|traefikEnabled:.*|traefikEnabled: true|" testcenter-values.yaml && rm testcenter-values.yaml.bak

    else
      declare traefik_env_var_name

      for traefik_env_var_name in "${TRAEFIK_ENV_VAR_ORDER[@]}"; do
        declare traefik_env_var_value
        read -p "${traefik_env_var_name}: " -er -i "${TRAEFIK_ENV_VARS[${traefik_env_var_name}]}" traefik_env_var_value
        TRAEFIK_ENV_VARS[${traefik_env_var_name}]=${traefik_env_var_value}
      done

    fi

    declare testcenter_env_var_name
    for testcenter_env_var_name in "${TESTCENTER_ENV_VAR_ORDER[@]}"; do
      declare testcenter_env_var_nameenv_var_value
      read -rep "${testcenter_env_var_name}: " -i "${TESTCENTER_ENV_VARS[${testcenter_env_var_name}]}" \
        testcenter_env_var_nameenv_var_value
      TESTCENTER_ENV_VARS[${testcenter_env_var_name}]=${testcenter_env_var_nameenv_var_value}
    done

    sed -i.bak "s|baseDomain:.*|baseDomain: ${TRAEFIK_ENV_VARS[TESTCENTER_BASE_DOMAIN]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|httpPort:.*|httpPort: ${TRAEFIK_ENV_VARS[HTTP_PORT]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|httpsPort:.*|httpsPort: ${TRAEFIK_ENV_VARS[HTTPS_PORT]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|tlsEnabled:.*|tlsEnabled: ${TRAEFIK_ENV_VARS[TLS_ENABLED]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak

    sed -i.bak "s|redisPassword: \&redisPassword.*|redisPassword: \&redisPassword ${TESTCENTER_ENV_VARS[REDIS_PASSWORD]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|mysqlRootPassword:.*|mysqlRootPassword: ${TESTCENTER_ENV_VARS[MYSQL_ROOT_PASSWORD]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|mysqlUser: \&dbUser.*|mysqlUser: \&dbUser ${TESTCENTER_ENV_VARS[MYSQL_USER]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|mysqlPassword: \&dbUserPassword.*|mysqlPassword: \&dbUserPassword ${TESTCENTER_ENV_VARS[MYSQL_PASSWORD]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    sed -i.bak "s|passwordSalt:.*|passwordSalt: ${TESTCENTER_ENV_VARS[MYSQL_SALT]}|" \
      testcenter-values.yaml && rm testcenter-values.yaml.bak
    printf "Customization of Testcenter default configuration done (q.v. testcenter-values.yaml).\n\n"

    printf "Installing 'Testcenter' in the 'tc' namespace ...\n"
    if ! helm install testcenter oci://registry-1.docker.io/iqbberlin/testcenter \
      --namespace tc \
      --create-namespace \
      --values testcenter-values.yaml \
      --version ${TESTCENTER_CHART_VERSION}; then

      printf "\n'Testcenter %s' installation failed.\n" ${TESTCENTER_VERSION}
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue

      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Install script finished with error.\n\n'
        exit 1
      fi

    else
      printf "'Testcenter' installation done.\n"
    fi

    printf "\n"
  fi
}

main() {
  printf "\n==================================================\n"
  printf "Installing Testcenter K8s Cluster via Helm"
  printf "\n==================================================\n"

  check_prerequisites

  printf "The Testcenter K8s Cluster uses 'Traefk %s' as Ingress Controller and " ${TRAEFIK_VERSION}
  printf "'Longhorn %s' for persistent volumes.\n" ${LONGHORN_VERSION}
  printf -- "- If you don't want to use these, you have to configure ingress routes and storages classes by yourself.\n"
  printf -- "- If you are already running 'traefik' and/or 'longhorn' but using older versions, please update them "
  printf "first to the appropriate version!\n\n"

  install_longhorn
  install_traefik
  install_testcenter

  printf "'%s' finished successfully.\n\n" "${0}"
}

main
