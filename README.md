** This is the next-generation repository of Testcenter which is not in charge right now. Until it's ready please 
refer to [https://github.com/iqb-berlin/testcenter-setup]. **


[comment]: <> ([![License: MIT]&#40;https://img.shields.io/badge/License-MIT-yellow.svg&#41;]&#40;https://opensource.org/licenses/MIT&#41;)

[comment]: <> ([![&#40;CI Status&#41;]&#40;https://scm.cms.hu-berlin.de/iqb/testcenter-setup/badges/master/pipeline.svg&#41;]&#40;https://scm.cms.hu-berlin.de/iqb/testcenter-setup&#41;)

[comment]: <> (![GitHub tag &#40;latest SemVer&#41;]&#40;https://img.shields.io/github/v/tag/iqb-berlin/testcenter-setup&#41;)

[comment]: <> (# Testcenter-Setup)

[comment]: <> (Following the instructions below, you will install the web-application "IQB-Testcenter" on your server. You will get handy commands to start and stop the services.)

[comment]: <> (## Application structure)

[comment]: <> (The source code and therefore the application is separated in three submodules:)

[comment]: <> (* Frontend: Angular based components to be loaded into the browser as single page application. You find the source code repository [here]&#40;https://github.com/iqb-berlin/testcenter-frontend&#41;.)

[comment]: <> (* Backend php+database: Php based components to handle most of the requests from frontend; connects to the database; source code ist published [here]&#40;https://github.com/iqb-berlin/testcenter-backend&#41;, the API is documented [here]&#40;https://iqb-berlin.github.io/testcenter-backend/api/&#41;)

[comment]: <> (* Backend node.js: Additional server component to implement one special feature "test operator's monitor")

[comment]: <> (In order to install the whole application, one must install all components. Sure, this could be done the traditional way:)

[comment]: <> (* clone the code repositories)

[comment]: <> (* install the required software &#40;npm install/compose&#41;)

[comment]: <> (* transpile/build)

[comment]: <> (* setup database)

[comment]: <> (* setup web server, set routes etc.)

[comment]: <> (To ease this process and to avoid mess after updates/upgrades, every module consist of one folder "docker". There you find scripts for docker based installation. The repository of this document you're reading now binds all docker install procedures together. This way, you install everything you need in one step.)

[comment]: <> (# Preconditions)

[comment]: <> (Before you follow the instructions below, you need to install [docker]&#40;https://docs.docker.com/engine/install/ubuntu/#installation-methods&#41;,  [docker-compose]&#40;https://docs.docker.com/compose/install/&#41; and `make`. We do not explain these applications, this is beyond the scope of this document.)

[comment]: <> (Although all steps below could be done in another operating system environment, we go for a unix/linux.)

[comment]: <> (# Installation for production only)

[comment]: <> ("Production" here means that you just want to install and use the application, not more. You do not like to get a look behind the curtain or to run sophisticated performance analyses. This type of installation has fewer requirements in regard of software and space.)

[comment]: <> (Technically, you download pre-built images from Docker Hub.)

[comment]: <> (## 1. Download install script)

[comment]: <> (The installation script requires bash to run. Go to a directory of your choice and get it:)

[comment]: <> (```)

[comment]: <> ( wget https://raw.githubusercontent.com/iqb-berlin/iqb-scripts/master/install.sh)

[comment]: <> (```)

[comment]: <> (Also download the project specific configuration for the install script:)

[comment]: <> (```)

[comment]: <> ( wget https://raw.githubusercontent.com/iqb-berlin/testcenter-setup/master/config/install_config)

[comment]: <> (```)

[comment]: <> (## 2. Run installation)

[comment]: <> (```)

[comment]: <> ( bash install.sh)

[comment]: <> (```)

[comment]: <> (Now, your system will get checked to ensure that you have `docker`, `docker-compose` and `make` ready to work. Then, you need to put in some parameters for your installation:)

[comment]: <> (* target directory)

[comment]: <> (* host name &#40;can be changed later&#41;)

[comment]: <> (* MySql connection parameters &#40;database name, root password etc.&#41;)

[comment]: <> (## 3. Run server)

[comment]: <> (After you've got "--- INSTALLATION SUCCESSFUL ---", you change into the installation directory and type)

[comment]: <> (```)

[comment]: <> (make run)

[comment]: <> (```)

[comment]: <> (Docker will then start all containers: Frontend, Backends, and one traefik service to handle routing. To check, go to another computer and put in the host name of the installation - and enjoy!)

[comment]: <> (If you like to stop the server later, run)

[comment]: <> (```)

[comment]: <> (make stop)

[comment]: <> (```)

[comment]: <> (## 4. Login and change super user password)

[comment]: <> (Right after installation, please log in! At start, you have one user prepared: `super` with password `user123`. Because everyone can read this here and in the scripts, you should get up your shields by changing at least the password &#40;go to "System-Admin"&#41;.)

[comment]: <> (## 5. Update)

[comment]: <> (Run the script _update.sh_ in the root directory. This will compare your local component versions with the latest release and update and restart the software stack.)

[comment]: <> (Alternatively you may also manually edit the file `docker-compose.prod.yml`. Find the lines starting with **image** and edit the version tag at the end.)

[comment]: <> (Check the [IQB Docker Hub Page]&#40;https://hub.docker.com/u/iqbberlin&#41; for latest images.)

[comment]: <> (# Installation for development)

[comment]: <> (The other way of installation gives you more options to access data, logs, to change settings more in detail, to find bugs and even to change code to meet your needs. Our applications are great, but not perfect at all!)

[comment]: <> (Technically, you check out all source code and build the application modules as developers do. The whole Angular development framework will be installed with all tools. The build process will include all unit end e2e tests we prepared.  )

[comment]: <> (We will not explain every step in detail. You should be familiar with git and bash and file handling in Unix, editing a text file etc.)

[comment]: <> (## 1. Clone this setup repository)

[comment]: <> (After the clone is done, you need to init the submodules feature of git:)

[comment]: <> (```)

[comment]: <> (git submodule init)

[comment]: <> (git submodule update)

[comment]: <> (```)

[comment]: <> (## 2. Configuration)

[comment]: <> (Run)

[comment]: <> (```)

[comment]: <> (make init-dev-config)

[comment]: <> (```)

[comment]: <> (> :warning: This creates configuration files with values meant for)

[comment]: <> (development purposes only. For any production setup be sure to customize the)

[comment]: <> (files. Most importantly use your own passwords!)

[comment]: <> (The important configuration files are:)

[comment]: <> (* `.env` - This file contains sensitive information about database access)

[comment]: <> (and user logins)

[comment]: <> (* `testcenter-frontend/src/environments/environment.ts` - Here information)

[comment]: <> (about accessing the backend is kept for the frontend component)

[comment]: <> (There is one important setting to be made in the generated file `.env`. On the first line, set the variable _HOSTNAME_ to either the IP, or the hostname of the machine under which it is reachable.)

[comment]: <> (The other setting is the address of the broadcasting service.)

[comment]: <> (Replace _localhost_ in variable _BROADCAST_SERVICE_URI_SUBSCRIBE_ with the actual hostname.)

[comment]: <> (## 3. Updating)

[comment]: <> (```)

[comment]: <> (git pull)

[comment]: <> (git submodule update --recursive)

[comment]: <> (```)

[comment]: <> (# More server setup and handling)

[comment]: <> (## SSL)

[comment]: <> (For a setup using SSL certificates &#40;HTTPS connection&#41;, the certificates need to be placed under _config/certs_ and their name be put in _config/cert_config.yml_.)

[comment]: <> (## Start/stop)

[comment]: <> (Depending on which setup you are using different commands may be used for starting and stopping the application suite.)

[comment]: <> (Most commands are usable via Makefile-targets: `make <command>`.)

[comment]: <> (For specific commands refer to the [docker-compose]&#40;https://docs.docker.com/compose/&#41; documentation.)

[comment]: <> (### Starting)

[comment]: <> (Every startup command can be used in detached mode, which will free up the console or in blocking mode which uses the current console window)

[comment]: <> (for all logging. Refer to the OS commands for sending processes to the background etc.)

[comment]: <> (```)

[comment]: <> (make run)

[comment]: <> (```)

[comment]: <> (or)

[comment]: <> (```)

[comment]: <> (make run-detached)

[comment]: <> (```)

[comment]: <> (### Stopping)

[comment]: <> (For attached console mode simply terminate the process &#40;Ctrl+C under Linux&#41;.)

[comment]: <> (When in detached mode you may use the following command to stop the applications.)

[comment]: <> (```)

[comment]: <> (make stop)

[comment]: <> (```)

[comment]: <> (## Logs)

[comment]: <> (Because the server is running in docker, you get logs via `docker logs <process>`.)

[comment]: <> (## Application access)

[comment]: <> (Open the target hostname &#40;http://localhost for the development version&#41;)

[comment]: <> (in your browser. You see now the testcenter application with testdata.)

[comment]: <> (Right after start, two logins are prepared:)

[comment]: <> (- Username `super` and password `user123` as admin user)

[comment]: <> (- Username `test` and password `user123` and code `xxx` as test-taker)

[comment]: <> (---)

[comment]: <> (You can reach the backend API directly under the "api" path.)

[comment]: <> (http://localhost/api)

[comment]: <> (## Trouble Shooting)

[comment]: <> (### Timeouts when building fresh images)

[comment]: <> (Build them separately or increase docker-compose timeout:)

[comment]: <> (`export COMPOSE_HTTP_TIMEOUT=300`.)

[comment]: <> (### Strange SQL Constraint error after re-build)

[comment]: <> (When you rebuild make sure, that you not only delete all previous volumes but)

[comment]: <> (delete all contents of `testcenter-backend/src/vo_data` as well.)

[comment]: <> (Otherwise, you get an erroneous application state.)

[comment]: <> ([Will be fixed]&#40;https://github.com/iqb-berlin/testcenter-setup/issues/9&#41;.)

[comment]: <> (### Error when using Make commands)

[comment]: <> (Should any produce an error, you may have to build the command manually. Refer the the Makefile-target you used and replace `up` with `stop`.)

[comment]: <> (For example if you ran `make run-prod-nontls-detached`, you can stop with:)

[comment]: <> (```)

[comment]: <> (docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml stop)

[comment]: <> (```)
