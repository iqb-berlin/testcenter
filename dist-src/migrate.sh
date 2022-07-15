#!/bin/bash

set -e

make down

wget https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/manage.sh
wget https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/docker-compose.yml
wget https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/docker-compose.prod.yml
wget https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/docker-compose.prod.tls.yml

rm update.sh
rm migrate.sh

make pull
make run-detached