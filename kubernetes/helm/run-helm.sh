#!/bin/bash

# Configuration
TRAEFIK_VERSION="v2.11"
CHART_VERSION="0.1.0"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Install CRDs
echo -e "${GREEN}Installing Traefik ${TRAEFIK_VERSION} CRDs...${NC}"
kubectl apply -f "https://raw.githubusercontent.com/traefik/traefik/${TRAEFIK_VERSION}/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml"

# Check if CRD installation was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}CRDs installed successfully${NC}"
else
    echo "Failed to install CRDs"
    exit 1
fi

# Install Traefik via Helm
echo -e "${GREEN}Installing Traefik ${TRAEFIK_VERSION} via Helm...${NC}"
helm install traefik ./mychart --version ${CHART_VERSION}