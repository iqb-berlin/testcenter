#!/bin/bash
set -e
# make sure, this file rights 644, otherwise it will say "docker_process_sql - command not found"
docker_process_sql <<< "create database if not exists \`TEST_$MYSQL_DATABASE\`;
grant all privileges on \`TEST_$MYSQL_DATABASE\`.* to '$MYSQL_USER'@'%';"
echo "Test DB created"



