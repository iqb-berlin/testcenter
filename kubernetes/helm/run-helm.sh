#!/bin/bash

# Install CRDs
echo -e "Installing Traefik v2.11 CRDs..."

if [ -x "$(command -v minikube)" ]; then
    minikube kubectl -- apply -f "https://raw.githubusercontent.com/traefik/traefik/v2.11/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml"
else
    kubectl apply -f "https://raw.githubusercontent.com/traefik/traefik/v2.11/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml"
fi

# Check if CRD installation was successful
if [ $? -eq 0 ]; then
    echo -e "CRDs installed successfully"
else
    echo "Failed to install CRDs"
    exit 1
fi

echo -e "Installing Testcenter v2.11 via Helm..."
helm install testcenter .