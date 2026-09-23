#!/usr/bin/env bash

set -e

SCHEMAS_DIR="/var/www/testcenter/data/.schemas"
COMPATIBILITY_FILE="$1"

# one line per repo: "<repo> <min major> <max major>"
SUPPORTED=$(php -r '
  foreach (json_decode(file_get_contents($argv[1]), true)["xml-schema-versions"] as $schema) {
    echo "{$schema["repo"]} {$schema["min"]} {$schema["max"]}\n";
  }' "$COMPATIBILITY_FILE")

echo "Downloading XSD schemas..."

while read -r repo min max; do
    echo "Fetching releases for $repo (supported major versions: $min to $max)..."

    # GitHub API abfragen
    releases=$(curl -sL "https://api.github.com/repos/iqb-specifications/$repo/releases" \
        | grep '"tag_name"' \
        | sed 's/.*"tag_name": "\(.*\)".*/\1/')

    if [ -z "$releases" ]; then
        echo "WARNING: No releases found for $repo!"
        continue
    fi

    for version in $releases; do
        major="${version%%.*}"
        if [ "$major" -lt "$min" ] || [ "$major" -gt "$max" ]; then
            echo "Skipping unsupported version $version"
            continue
        fi
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
done <<< "$SUPPORTED"

echo "Done."