#!/bin/bash

# Author: Richard Henck (richard.henck@iqb.hu-berlin.de)

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

echo "Please enter the user account the testcenter should run with.

It will be created if not existing. Also it will be able to use docker commands.
(For existing user accounts, root-privileges are not necessary and should even
be avoided.)
"
read  -p 'Username: ' -e -i 'iqb' TARGET_USER

echo ""
read  -p 'Install directory: ' -e -i "/home/${TARGET_USER}/testcenter" TARGET_DIR


# TODO ask for config settings and replace in .env file
# read  -p 'Hostname: ' -e -i $(hostname) HOSTNAME
#
# echo 'MySQL database settings'
# echo ' You can press Enter on the password prompts and default values are used.
# This strongly disadvised. Always use proper passwords!'
# MYSQL_ROOT_PASSWORD=secret_root_pw
# MYSQL_DATABASE=iqb_tba_testcenter
# MYSQL_USER=iqb_tba_db_user
# MYSQL_PASSWORD=iqb_tba_db_password
# read  -p 'Database root password: ' MYSQL_ROOT_PASSWORD
# read  -p 'Database name: ' -e -i $MYSQL_DATABASE MYSQL_DATABASE
# read  -p 'Database user: ' -e -i $MYSQL_USER MYSQL_USER
# read  -p 'Database user password: ' MYSQL_PASSWORD


# Install docker
apt-get update
apt-get install \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg-agent \
  software-properties-common --assume-yes
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |  apt-key add -
add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable"
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io --assume-yes

# ADD user account
adduser --gecos "" ${TARGET_USER}

# Add docker group
groupadd docker
usermod -aG docker ${TARGET_USER}

# Install docker compose
curl -L "https://github.com/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install make for easier start/stop commands
apt-get install make --assume-yes

service docker restart

# Unpack application
mkdir $TARGET_DIR
tar -xzf dist.tar.gz -C $TARGET_DIR
chown -R $TARGET_USER:$TARGET_USER $TARGET_DIR

echo '
 --- INSTALLATION SUCCESSFUL ---
'
echo 'Check the settings in the file '.env' in the installation directory.

Most importantly the hostname at the top and for the setting BROADCAST_SERVICE_URI_SUBSCRIBE replace the localhost part.

Also Passwords!'

echo '

Refer to readme for instructions on running the software.'
