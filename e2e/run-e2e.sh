#!/usr/bin/env bash

while true; do
  declare dir_name=$(basename "$PWD")
  services_count=$(docker ps --filter name="${dir_name}"-* --format='{{.Names}} → {{.Status}}' | wc -l) #todo dir name
  if [[ "$services_count" -eq 7 ]]; then
    cd e2e || exit
    npx cypress open
    break
  fi
  echo "E2E launcher: $services_count of 7 startet. Please wait."
  sleep 3
done
