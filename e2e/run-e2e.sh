#!/bin/bash

while true; do
  services_count=$(docker ps --filter name=testcenter-* --format='{{.Names}} → {{.Status}}' | wc -l)
  if [[ "$services_count" -eq 7 ]]; then
    cd e2e || exit
    npx cypress open
    break
  fi
  echo "E2E launcher: $services_count of 7 startet. Please wait."
  sleep 3
done
