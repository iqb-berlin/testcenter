[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Travis (.com)](https://img.shields.io/travis/com/iqb-berlin/testcenter-setup?style=flat-square)](https://travis-ci.com/iqb-berlin/testcenter-setup)
![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/iqb-berlin/testcenter-setup?style=flat-square)

# Testcenter
(Docker-)Setup for the Testcenter Application

This repository aims to integrate the components of the IQB
Testcenter application and create a setup to be used in test and
production environments. It uses git subrepositories to pull in the source
code (including instructions on creating docker containers) of the components
from which a containers are created and orchestrated.

The most needed commands for installation and usage are kept in a
Makefile in the root directory. You can run `make <command>` on the command
line.

## Installation & Configuration

There are 2 ways to install and use the software suite. One is for
development purposes, where the source code for the components is downloaded
and the docker images are built locally.
The other is for production environments. Here pre-built image are downloaded
from Docker Hub and there is less possibility for accessing and configuring
the components.

### Development environment

#### Software Prerequisites
- docker version 19.03.1
- docker-compose version 1.24.1
- (optional) make

#### Cloning the repository

Because git submodules are used you need to clone them as well as the main
repository. You can use the following command.

`git clone --recurse-submodules https://github.com/iqb-berlin/testcenter-setup`

#### Configuration

```
make init-dev-config
```
> :warning: This creates configuration files with values meant for
development purposes only. For any production setup be sure to customize the
files. Most importantly use your own passwords!

The important configuration files are:
* `.env` - This file contains sensitive information about database access
and user logins
* `testcenter-frontend/src/environments/environment.ts` - Here information
about accessing the backend is kept for the frontend component

There is one important setting to be made in the generated file `.env`.
On the first line set the variable _HOSTNAME_ to either
the IP or the hostname of the machine under which it is reachable.

The other setting is the address of the broadcasting service.
Replace _localhost_ in variable _BROADCAST_SERVICE_URI_SUBSCRIBE_ with the
actual hostname.

#### Updating
```
git pull
git submodule update --recursive
```

### Production environment

#### Installation
- Download the [installation script](https://raw.githubusercontent.com/iqb-berlin/testcenter-setup/master/dist/install.sh) and the release [package] (https://raw.githubusercontent.com/iqb-berlin/testcenter-setup/master/dist/dist.tar.gz) from the _dist_ folder.
- Run the script _install.sh_ with sudo privileges
```
sudo ./install.sh
```
The script will create a user account on your machine with which the software will be run and unpack files to the specified directory.
You can also specify an existing user and a custom install directory.

- After the script has run, edit the file _.env_ in the target directory.
  - Change passwords for:
    - MYSQL_ROOT_PASSWORD
    - MYSQL_PASSWORD
  - Change all occurences of _localhost_ to either
  the IP or the hostname of the machine under which it is reachable. This is the first line _HOSTNAME_ and the setting _BROADCAST_SERVICE_URI_SUBSCRIBE_

##### SSL

For a setup using SSL certificates (HTTPS connection), the certificates need to be placed under _config/certs_ and
their name be put in _config/cert_config.yml_.

#### Updating

To update the components you need to manually edit the files
`docker-compose.prod.nontls.yml`
or `docker-compose.prod.tls.yml` depending on your usage of SSL certificates.
Find the lines starting with **image** and edit the version tag at the end.

## Usage

Depending on which setup you are using different commands may be used for starting and stopping the application suite.
Most commands are usable via Makefile-targets: `make <command>`.

For specific commands refer to the [docker-compose](https://docs.docker.com/compose/) documentation.

### Starting
Every startup command can be used in detached mode, which will free up the console or in blocking mode which uses the current console window
for all logging. Refer to the OS commands for sending processes to the background etc.

```
make run-dev
```
or
```
make run-dev-detached
```
For production setups you may use the respective counterparts. take care in using the one for TLS or not.
```
make run-prod-nontls
```
...

### Stopping
For attached console mode simply terminate the process (Ctrl+C under Linux).

When in detached mode you may use the following command to stop the applications.
```
make stop
```

### Logs
> :warning: TODO

### Application access

Open the target hostname (http://localhost for the development version)
in your browser. You see now the testcenter application with testdata.

You can log in with:
- Username `super` and password `user123` as admin user
- Username `test` and password `user123` and code `xxx` as test-taker
---
You can reach the backend API directly under the "api" path.

http://localhost/api

## Trouble Shooting

### Timeouts when building fresh images
Build them separately or increase docker-compose timeout:
`export COMPOSE_HTTP_TIMEOUT=300`.

### Strange SQL Constraint error after re-build
When you rebuild make sure, that you not only delete all previous volumes but
delete all contents of `testcenter-backend/src/vo_data` as well.
Otherwise, you get an erroneous application state.
[Will be fixed](https://github.com/iqb-berlin/testcenter-setup/issues/9).
