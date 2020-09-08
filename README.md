[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

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

## Installation

### Software Prerequisites
- docker version 19.03.1
- docker-compose version 1.24.1

### Cloning the repository

Because git submodules are used you need to clone them as well as the main
repository. You can use the following command.

`git clone --recurse-submodules https://github.com/iqb-berlin/testcenter-setup`

### Prepare configuration

```
make init-config
```
> :warning: This creates configuration files with values meant for
development purposes only. For any production setup be sure to customize the
files. Most importantly use your own passwords!

The important configuration files are:
* `.env` - This file contains sensitive information about database access
and user logins
* `testcenter-frontend/src/environments/environment.ts` - Here information
about accessing the backend is kept for the frontend component

**There is one important setting to be made in the generated file `.env`.
On the first line set the variable _HOSTNAME_ to _localhost_ for a
local installation on your computer. For a remote installation use either
the IP or the hostname of the machine under which it is reachable.
For a remote installation you also need to replace _localhost_ with
this hostname/IP in the file `testcenter-frontend/src/environments/environment.ts` under the setting
_testcenterUrl_.**

## Installing and Running the application

```
make run
```
To stop the application simply terminate the process (Ctrl+C under Linux).
When running in detached mode you may use the following command to stop.
```
make stop
```

## Update
```
git pull
git submodule update --recursive
```

## Usage

Open http://localhost in your browser. You see now the testcenter application
with testdata.

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
