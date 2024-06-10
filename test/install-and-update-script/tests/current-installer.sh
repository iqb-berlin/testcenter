#!/bin/bash

echo_h2 "The installer should exit successfully"

before_each
cp -r /dist-src/install.sh /dist/install.sh
cp -r /dist-src/update.sh /dist/update.sh

cd /dist
bash install.sh <<EOF
/dist/testcenter
my.hostname.de
root_password
salt
db_user_name
db_password
y
EOF

expect_init_script_ok

expect_dir_equals /dist/testcenter \
".
  |-Makefile
  |-config
  |  |-certs
  |  |-nginx.conf
  |  |-tls-config.yml
  |-docker-compose.prod.tls.yml
  |-docker-compose.prod.yml
  |-docker-compose.yml
  |-update.sh"