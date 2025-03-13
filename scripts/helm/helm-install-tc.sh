#!/bin/bash

declare TESTCENTER_VERSION="16.0.0"
declare TRAEFIK_VERSION="v3.3.2"
declare LONGHORN_VERSION="v1.7.2"
declare REQUIRED_PACKAGES=("kubectl version" "kubectl cluster-info" "helm version")

declare LONGHORN_ENABLED=false
declare TRAEFIK_ENABLED=false

declare -A TRAEFIK_ENV_VARS
TRAEFIK_ENV_VARS[TESTCENTER_BASE_DOMAIN]=testcenter.domain.tld
TRAEFIK_ENV_VARS[HTTP_PORT]=80
TRAEFIK_ENV_VARS[HTTPS_PORT]=443
TRAEFIK_ENV_VARS[TLS_ENABLED]=false
declare TRAEFIK_ENV_VAR_ORDER=(TESTCENTER_BASE_DOMAIN HTTP_PORT HTTPS_PORT TLS_ENABLED)

declare -A TESTCENTER_ENV_VARS
TESTCENTER_ENV_VARS[MYSQL_ROOT_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
TESTCENTER_ENV_VARS[MYSQL_USER]=iqb_tba_db_user
TESTCENTER_ENV_VARS[MYSQL_PASSWORD]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 16 | head -n 1)
TESTCENTER_ENV_VARS[MYSQL_SALT]=$(LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 5 | head -n 1)
declare TESTCENTER_ENV_VAR_ORDER=(MYSQL_ROOT_PASSWORD MYSQL_USER MYSQL_PASSWORD MYSQL_SALT)

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

    if ! helm install longhorn ./longhorn --namespace longhorn-system --create-namespace; then
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

    if ${LONGHORN_ENABLED}; then
      printf "Configure Traefik 'custom-values' for 'longhorn persistent volumes' ...\n"
      sed -i.bak "s|accessMode:.*|accessMode: ReadWriteMany|" \
        custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
      sed -i.bak "s|storageClass:.*|storageClass: longhorn|" \
        custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
      sed -i.bak "s|#fsGroup:|fsGroup:|" \
        custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
      sed -i.bak "s|#fsGroupChangePolicy:|fsGroupChangePolicy:|" \
        custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
      printf "Traefik 'custom-values' configuration for 'longhorn persistent volumes' done.\n\n"
    fi

    printf "Configure Traefik Ingress for Testcenter ...\n"
    declare traefik_env_var_name

    for traefik_env_var_name in "${TRAEFIK_ENV_VAR_ORDER[@]}"; do
      declare traefik_env_var_value
      read -p "${traefik_env_var_name}: " -er -i "${TRAEFIK_ENV_VARS[${traefik_env_var_name}]}" traefik_env_var_value
      TRAEFIK_ENV_VARS[${traefik_env_var_name}]=${traefik_env_var_value}
    done

    sed -i.bak "s|httpPort: \&httpPort.*|httpPort: \&httpPort ${TRAEFIK_ENV_VARS[HTTP_PORT]}|" \
      custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
    sed -i.bak "s|httpsPort: \&httpsPort.*|httpsPort: \&httpsPort ${TRAEFIK_ENV_VARS[HTTPS_PORT]}|" \
      custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
    sed -i.bak "s|tlsEnabled: \&tlsEnabled.*|tlsEnabled: \&tlsEnabled ${TRAEFIK_ENV_VARS[TLS_ENABLED]}|" \
      custom/traefik/custom-values.yaml && rm custom/traefik/custom-values.yaml.bak
    printf "Traefik Ingress configuration for Testcenter done.\n\n"

    printf "Installing 'Traefik' Ingress Controller in the 'kube-system' namespace ...\n"
    printf -- "-> 'Install Traefik-CRDs' ...\n"

    if ! helm install traefik-crds ./traefik-crds --namespace kube-system; then
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

    if ! helm install traefik ./traefik \
      --namespace kube-system \
      --values ./traefik/values.yaml \
      --values ./traefik/custom-values.yaml \
      --skip-crds; then

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

    if ${LONGHORN_ENABLED}; then
      printf "Configure Testcenter 'custom-values' for 'longhorn persistent volumes' ...\n"
      sed -i.bak "s|longhornEnabled:.*|longhornEnabled: true|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|cacheServerPvcStorageClassName:.*|cacheServerPvcStorageClassName: longhorn-single|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|cacheServerPvcAccessMode:.*|cacheServerPvcAccessMode: ReadWriteOnce|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|backendPvcStorageClassName:.*|backendPvcStorageClassName: longhorn|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|backendPvcAccessMode:.*|backendPvcAccessMode: ReadWriteMany|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|backendConfigPvcStorageClassName:.*|backendConfigPvcStorageClassName: longhorn|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|backendConfigPvcAccessMode:.*|backendConfigPvcAccessMode: ReadWriteMany|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|dbPvcStorageClassName:.*|dbPvcStorageClassName: longhorn-single|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      sed -i.bak "s|dbPvcAccessMode:.*|dbPvcAccessMode: ReadWriteOnce|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
      printf "Testcenter 'custom-values' configuration for 'longhorn persistent volumes' done.\n\n"
    fi

    printf "Configure Testcenter 'custom-values' ...\n"

    if ${TRAEFIK_ENABLED}; then
      sed -i.bak "s|traefikEnabled:.*|traefikEnabled: true|" \
        testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
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
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    sed -i.bak "s|httpPort:.*|httpPort: ${TRAEFIK_ENV_VARS[HTTP_PORT]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    sed -i.bak "s|httpsPort:.*|httpsPort: ${TRAEFIK_ENV_VARS[HTTPS_PORT]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    sed -i.bak "s|tlsEnabled:.*|tlsEnabled: ${TRAEFIK_ENV_VARS[TLS_ENABLED]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak

    sed -i.bak "s|mysqlRootPassword:.*|mysqlRootPassword: ${TESTCENTER_ENV_VARS[MYSQL_ROOT_PASSWORD]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    sed -i.bak "s|mysqlUser: \&dbUser.*|mysqlUser: \&dbUser ${TESTCENTER_ENV_VARS[MYSQL_USER]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    sed -i.bak "s|mysqlPassword: \&dbUserPassword.*|mysqlPassword: \&dbUserPassword ${TESTCENTER_ENV_VARS[MYSQL_PASSWORD]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    sed -i.bak "s|passwordSalt:.*|passwordSalt: ${TESTCENTER_ENV_VARS[MYSQL_SALT]}|" \
      testcenter/custom-values.yaml && rm testcenter/custom-values.yaml.bak
    printf "Testcenter 'custom-values' configuration for Traefik Ingress Controller done.\n\n"

    printf "Installing 'Testcenter' in the 'tc' namespace ...\n"

    if ! helm install testcenter ./testcenter \
      --namespace tc \
      --create-namespace \
      --values ./testcenter/values.yaml \
      --values ./testcenter/custom-values.yaml; then

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
