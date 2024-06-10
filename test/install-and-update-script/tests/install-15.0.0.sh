#!/bin/bash

echo_h2 "The installer of 15.0.0 should install 15.0.0"

before_each

cd /dist

wget -nv -O install.sh "https://scm.cms.hu-berlin.de/iqb/testcenter/-/raw/15.0.0/dist-src/install.sh?ref_type=tags"

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
  |-docker-compose.prod.yml
  |-docker-compose.yml
  |-update.sh"

# no docker-compose.prod.tls.yml in this version!

echo_h2 "And update to 15.1.8"

