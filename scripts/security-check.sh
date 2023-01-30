#!/bin/bash

#Build:
#docker build --target prod -t iqbberlin/testcenter-backend:test -f docker/backend.Dockerfile .

docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image \
--security-checks vuln $1:$2

# Use this param to only show issues which can be solved by updating
#--ignore-unfixed