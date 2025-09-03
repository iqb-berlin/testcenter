#!/usr/bin/env bash

declare REQUIRED_PACKAGES=("kubectl version" "kubectl cluster-info" "helm version")

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

uninstall_testcenter() {
  declare continue
  read -rep "Do you want to uninstall 'Testcenter'? [Y/n] " -n 1 continue
  if ! [[ ${continue} =~ ^[nN]$ ]]; then
    printf "Uninstalling 'Testcenter' in the 'tc' namespace ...\n"
    if ! helm uninstall --namespace tc testcenter; then
      printf "\n'Testcenter' uninstallation failed.\n"
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue
      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Uninstall script finished with error.\n\n'
        exit 1
      fi
    else
      kubectl delete job -n tc testcenter-backend-container-seed
      printf "'Testcenter' uninstallation done.\n"
    fi
    printf "\n"
  fi
}

uninstall_traefik() {
  declare continue
  read -rep "Do you want to uninstall 'Traefik ${TRAEFIK_VERSION}'? [Y/n] " -n 1 continue
  if ! [[ ${continue} =~ ^[nN]$ ]]; then
    printf "Uninstalling 'Traefik' Ingress Controller in the 'kube-system' namespace ...\n"

    printf -- "-> 'Uninstall Traefik-CRDs' ...\n"
    if ! helm uninstall --namespace kube-system traefik-crds; then
      printf "\n-> 'Traefik-CRDs' uninstallation failed.\n"
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue
      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Uninstall script finished with error.\n\n'
        exit 1
      fi
    else
      printf -- "-> 'Traefik-CRDs' uninstallation done.\n"
    fi
    printf "\n"

    printf -- "-> 'Uninstall Traefik' ...\n"
    if ! helm uninstall --namespace kube-system traefik; then
      printf "\n-> 'Traefik' uninstallation failed.\n"
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue
      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Uninstall script finished with error.\n\n'
        exit 1
      else
        printf "'Traefik' Ingress Controller uninstallation failed.\n\n"
        return
      fi
    else
      printf -- "-> 'Traefik' uninstallation done.\n"
    fi
    printf "\n"

    printf "'Traefik' Ingress Controller uninstallation done.\n\n"
  fi
}

uninstall_longhorn() {
  declare continue
  read -rep "Do you want to uninstall 'Longhorn'? [Y/n] " -n 1 continue
  if ! [[ ${continue} =~ ^[nN]$ ]]; then
    printf "Uninstalling 'Longhorn' in the 'longhorn-system' namespace ...\n"
    kubectl -n longhorn-system patch -p '{"value": "true"}' --type=merge lhs deleting-confirmation-flag
    if ! helm uninstall --namespace longhorn-system longhorn; then
      printf "\n'Longhorn' uninstallation failed.\n"
      read -rep "Do you want to continue anyway? [y/N] " -n 1 continue
      if ! [[ ${continue} =~ ^[yY]$ ]]; then
        printf 'Uninstall script finished with error.\n\n'
        exit 1
      fi
    else
      printf "'Longhorn' uninstallation done.\n"
    fi
    printf "\n"
  fi
}

main() {
  printf "\n==================================================\n"
  printf "Uninstalling Testcenter K8s Cluster via Helm"
  printf "\n==================================================\n"

  check_prerequisites
  uninstall_testcenter
  uninstall_traefik
  uninstall_longhorn

  printf "'%s' finished successfully.\n\n" "${0}"
}

main
