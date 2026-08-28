#!/usr/bin/env bash
set -euo pipefail

readonly test_database="TEST_${POSTGRES_DB}"

# psql's :"variable" expansion quotes the value as an SQL identifier, preserving the uppercase
# TEST_ prefix expected by DB::connectToTestDB(), without it everything would be folded to lowercase
psql \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --set ON_ERROR_STOP=1 \
  --set test_database="${test_database}" <<-'SQL'
CREATE DATABASE :"test_database";
SQL

echo "Test DB \"${test_database}\" created."
