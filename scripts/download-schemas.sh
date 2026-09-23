#!/usr/bin/env bash

set -e

SCHEMAS_DIR="/var/www/testcenter/data/.schemas"
COMPATIBILITY_FILE="$1"

# one line per repo: "<repo> <min major> <max major>"
SUPPORTED=$(php -r '
  foreach (json_decode(file_get_contents($argv[1]), true)["xml-schema-versions"] as $schema) {
    echo "{$schema["repo"]} {$schema["min"]} {$schema["max"]}\n";
  }' "$COMPATIBILITY_FILE")

fail() {
    echo "ERROR: $1" >&2
    exit 1
}

echo "Downloading XSD schemas..."

while read -r repo min max; do
    echo "Fetching versions of $repo (supported major versions: $min to $max)..."

    # version tags like "18.0", as used in the schema permalinks
    versions=$(GIT_TERMINAL_PROMPT=0 git ls-remote --tags --refs "https://github.com/iqb-specifications/$repo.git" < /dev/null) \
        || fail "Could not list the tags of $repo."
    versions=$(echo "$versions" | sed 's#.*refs/tags/##' | grep -E '^[0-9]+\.[0-9]+$' || true)

    downloaded=0
    for version in $versions; do
        major="${version%%.*}"
        if [ "$major" -lt "$min" ] || [ "$major" -gt "$max" ]; then
            echo "Skipping unsupported version $version"
            continue
        fi
        folder="$SCHEMAS_DIR/$repo/$version"
        mkdir -p "$folder"
        url="https://w3id.org/iqb/spec/$repo/$version"
        echo "Downloading $url -> $folder/$repo.xsd"
        curl -fsSL "$url" -o "$folder/$repo.xsd" < /dev/null \
            || fail "$url could not be downloaded."
        grep -q "<xs:schema" "$folder/$repo.xsd" \
            || fail "$url did not deliver an XSD schema."
        downloaded=$((downloaded + 1))
    done

    if [ "$downloaded" -eq 0 ]; then
        fail "No version of $repo within the supported major versions $min to $max found."
    fi
done <<< "$SUPPORTED"

echo "Done."