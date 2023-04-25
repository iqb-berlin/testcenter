#!/bin/bash
echo "create database if not exists \`TEST_$MYSQL_DATABASE\`;
grant all privileges on \`TEST_$MYSQL_DATABASE\`.* to '$MYSQL_USER'@'%';" \
  | docker_process_sql
echo "Test DB created"



