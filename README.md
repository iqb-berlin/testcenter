[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![(CI Status)](https://scm.cms.hu-berlin.de/iqb/testcenter-setup/badges/master/pipeline.svg)](https://scm.cms.hu-berlin.de/iqb/testcenter-setup)
![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/iqb-berlin/testcenter-setup)

# Testcenter-Setup
Following the instructions below, you will install the web-application "IQB-Testcenter" on your server. You will get handy commands to start and stop the services.

## Application structure
The source code and therefore the application is separated in three submodules:
* Frontend: Angular based components to be loaded into the browser as single page application. You find the source code repository [here](https://github.com/iqb-berlin/testcenter-frontend).
* Backend php+database: Php based components to handle most of the requests from frontend; connects to the database; source code ist published [here](https://github.com/iqb-berlin/testcenter-backend), the API is documented [here](https://iqb-berlin.github.io/testcenter-backend/api/)
* Backend node.js: Additional server component to implement one special feature "test operator's monitor" 

In order to install the whole application, one must install all components. Sure, this could be done the traditional way:
* clone the code repositories
* install the required software (npm install/compose)
* transpile/build
* setup database
* setup web server, set routes etc.
  
To ease this process and to avoid mess after updates/upgrades, every module consist of one folder "docker". There you find scripts for docker based installation. The repository of this document you're reading now binds all docker install procedures together. This way, you install everything you need in one step.

# Preconditions
Before you follow the instructions below, you need to install [docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods),  [docker-compose](https://docs.docker.com/compose/install/) and `make`. We do not explain these applications, this is beyond the scope of this document.

Although all steps below could be done in another operating system environment, we go for a unix/linux. 

# Installation for production only
"Production" here means that you just want to install and use the application, not more. You do not like to get a look behind the curtain or to run sophisticated performance analyses. This type of installation has fewer requirements in regard of software and space.

Technically, you download pre-built images from Docker Hub.

## 1. Download install script
The main installation script requires bash to run. Go to a directory of your choice and get it:
```
 wget https://raw.githubusercontent.com/iqb-berlin/testcenter-setup/master/dist/install.sh
```
## 2. Run installation
```
 bash install.sh
```
Now, your system will get checked to ensure that you have `docker`, `docker-compose` and `make` ready to work. Then, you need to put in some parameters for your installation:
* target directory
* host name (can be changed later)
* MySql connection parameters (database name, root password etc.)

## 3. Run server
After you've got "--- INSTALLATION SUCCESSFUL ---", you type
```
make run
```
Docker will then start all containers: Frontend, Backends, and one traefik service to handle routing. To check, go to another computer and put in the host name of the installation - and enjoy!

If you like to stop the server later, run
```
make stop
```
## 4. Login and change super user password 
Right after installation, please log in! At start, you have one user prepared: `super` with password `user123`. Because everyone can read this here and in the scripts, you should get up your shields by changing at least the password (go to "System-Admin").

# Installation for development
The other way of installation gives you more options to access data, logs, to change settings more in detail, to find bugs and even to change code to meet your needs. Our applications are great, but not perfect at all!

Technically, you check out all source code and build the application modules as developers do. The whole Angular development framework will be installed with all tools. The build process will include all unit end e2e tests we prepared.  

We will not explain every step in detail. You should be familiar with git and bash and file handling in Unix, editing a text file etc.

## 1. Clone this setup repository
After the clone is done, you need to init the submodules feature of git:
```
git submodule init
git submodule update
```

## 2. Configuration
Run
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

There is one important setting to be made in the generated file `.env`. On the first line, set the variable _HOSTNAME_ to either the IP, or the hostname of the machine under which it is reachable.

The other setting is the address of the broadcasting service.
Replace _localhost_ in variable _BROADCAST_SERVICE_URI_SUBSCRIBE_ with the actual hostname.

## 3. Updating
```
git pull
git submodule update --recursive
```

# More server setup and handling
## SSL

For a setup using SSL certificates (HTTPS connection), the certificates need to be placed under _config/certs_ and their name be put in _config/cert_config.yml_.

## Updating

To update the components you need to manually edit the files
`docker-compose.prod.nontls.yml`
or `docker-compose.prod.tls.yml` depending on your usage of SSL certificates.
Find the lines starting with **image** and edit the version tag at the end.

Check out the [IQB Docker Hub Page](https://hub.docker.com/u/iqbberlin) for latest images.

## Start/stop

Depending on which setup you are using different commands may be used for starting and stopping the application suite.
Most commands are usable via Makefile-targets: `make <command>`.

For specific commands refer to the [docker-compose](https://docs.docker.com/compose/) documentation.

### Starting
Every startup command can be used in detached mode, which will free up the console or in blocking mode which uses the current console window
for all logging. Refer to the OS commands for sending processes to the background etc.

```
make run
```
or
```
make run-detached
```

### Stopping
For attached console mode simply terminate the process (Ctrl+C under Linux).

When in detached mode you may use the following command to stop the applications.
```
make stop
```
## Logs

Because the server is running in docker, you get logs via `docker logs <process>`.

## Application access

Open the target hostname (http://localhost for the development version)
in your browser. You see now the testcenter application with testdata.

Right after start, two logins are prepared:
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

### Error when using Make commands
Should any produce an error, you may have to build the command manually. Refer the the Makefile-target you used and replace `up` with `stop`.
For example if you ran `make run-prod-nontls-detached`, you can stop with:
```
docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml stop
```
