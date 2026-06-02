#!/usr/bin/env bash

set -e

SCHEMAS_DIR="/var/www/testcenter/data/.schemas"

# Repos die durchsucht werden sollen
REPOS=(
    "testcenter-booklet-xml"
    "testcenter-testtaker-xml"
    "testcenter-syscheck-xml"
    "unit-xml"
)

echo "Downloading XSD schemas..."

for repo in "${REPOS[@]}"; do
    echo "Fetching releases for $repo..."

    # GitHub API abfragen
    releases=$(curl -sL "https://api.github.com/repos/iqb-specifications/$repo/releases" \
        | grep '"tag_name"' \
        | sed 's/.*"tag_name": "\(.*\)".*/\1/')

    if [ -z "$releases" ]; then
        echo "WARNING: No releases found for $repo!"
        continue
    fi

    for version in $releases; do
        folder="$SCHEMAS_DIR/$repo/$version"
        mkdir -p "$folder"
        url="https://w3id.org/iqb/spec/$repo/$version"
        echo "Downloading $url -> $folder/$repo.xsd"
        curl -sL "$url" -o "$folder/$repo.xsd"
        if [ ! -s "$folder/$repo.xsd" ]; then
            echo "WARNING: $url could not be downloaded or is empty!"
            rm -f "$folder/$repo.xsd"
        fi
    done
done

echo "Done."