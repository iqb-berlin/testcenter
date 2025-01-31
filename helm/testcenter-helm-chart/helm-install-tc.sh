#!/bin/bash

declare REQUIRED_PACKAGES=("kubectl version" "kubectl cluster-info" "helm version")

printf "\n==================================================\n"
printf "Installing Testcenter via Helm\n"
printf "\n==================================================\n"

printf "Checking required packages ...\n"
declare req_package
for req_package in "${REQUIRED_PACKAGES[@]}"; do
  if $req_package >/dev/null 2>&1; then
    printf -- "- '%s' is working.\n" "$req_package"
  else
    printf "'%s' does not seem to work, please install the corresponding package before running the script! \n" "$req_package"
    read -rep "Do you want to continue anyway? [Y/n]" -n 1 is_continue
    if [[ $is_continue =~ ^[nN]$ ]];then
      printf "Exiting...\n"
      exit 1
    fi
  fi
done
printf "Checking required packages done.\n\n"

printf  "Testcenter needs an Ingress Controller to function and recommends Traefik as Ingress Controller.\nIf you already have an existing Traefik Ingress Controller in your Cluster, exit this script and migrate manually to Traefik helm chart v27.0.2 (appVersion 2.11.2)\n"
read -rep "Do you want to install Traefik Ingress Controller in your K8 Cluster via this script? [Y/n]" -n 1 is_continue
if [[ $is_continue =~ ^[yY]$ ]] || [[ -z $is_continue ]]; then
  printf  "Continuing with installing Traefik Ingress Controller in the "tc" namespace\n"
  helm install traefik traefik/traefik --version 27.0.2 --create-namespace --namespace tc
  if [[ $? -ne 0 ]];then
    printf "Traefik Ingress Controller installation failed. Exiting...\n"
    exit 1
  fi
  printf "Traefik Ingress Controller installed successfully in namespace 'tc'\n"
else
  printf "If you are using an Ingress Controller other than Traefik, make sure to manually migrate the templates/ingress.yaml to fit the needs of your Ingress Controller\n"
fi

printf "Now installing Testcenter via Helm...\n"
helm install testcenter ./testcenter-16.0.0-alpha.tgz --create-namespace --namespace tc -f ./values.yaml
if [[ $? -ne 0 ]];then
  printf "Testcenter installation failed. Exiting...\n"
  exit 1
fi
