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

## Installation & Start

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


#### Running the application

```
make run
```
To stop the application simply terminate the process (Ctrl+C under Linux).
When running in detached mode you may use the following command to stop.
```
make stop
```

#### Update
```
git pull
git submodule update --recursive
```

### Production environment

#### Installation
Installation of the needed software (make, git and docker) can be done via
Ansible playbook, located in the scripts folder.

- Make sure you have a SSH access to the remote machine and a user with
sudo privileges. This user must be specified at the top of the ansible playbook file, under the setting _remote_user_.
- Change the target host name in the file _hosts_. You may also change the host identifier, but make sure to also update it in the playbook file under the setting _hosts_.
- Run the playbook
```
ansible-playbook playbook.yml -K -i hosts
```
- Enter the _sudo_ password of the remote user.

#### Configuration

```
make init-config
```
> :warning: This creates a dummy configuration file. Be sure to customize the settings and most importantly change the passwords.

- There is one important setting to be made in the generated file `.env`.
On the first line set the variable _HOSTNAME_ to either
the IP or the hostname of the machine under which it is reachable.
- The other setting is the address of the broadcasting service.
Replace _localhost_ in variable _BROADCAST_SERVICE_URI_SUBSCRIBE_ with the
actual hostname.

#### Running the application
This will start the production configuration and send the process to the background.
```
make run-prod-detached
```
For a setup using SSL certificates (HTTPS connection), you may use the following command. The certificates need to be placed under _config/certs_ and
their name be put in _config/cert_config.yml_.
```
make run-prod-tls-detached
```

You may use the following command to stop the applications.
```
make stop
```

#### Update
```
git pull
```

## Usage

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
