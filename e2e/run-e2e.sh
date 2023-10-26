#!/bin/bash

while true; do
  services_count=$(docker ps --filter name=testcenter-* --format='{{.Names}} → {{.Status}}' | grep --invert-match testcenter-traefik -c)
  unhealthy_count=$(docker ps --filter name=testcenter-* --format='{{.Names}} → {{.Status}}' | grep --invert-match testcenter-traefik | grep --invert-match '(healthy)' -c)
  if [[ "$services_count" -eq 6 && "$unhealthy_count" -eq 0 ]]; then
    cd e2e || exit
    npx cypress open
    break
  fi
  echo "E2E launcher: $unhealthy_count unhealthy of $services_count. Please wait."
  sleep 3
done
