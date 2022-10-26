---
layout: default
---

# Installation for production

"Production" here means that you just want to install and use the application, not more. You do not like to get a look behind the curtain or to run sophisticated performance analyses. This type of installation has fewer requirements in regard of software and space.

Technically, you download pre-built images from a Docker registry and run them.

## Preconditions

Before you follow the instructions below, you need to
install [docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods),
[docker-compose](https://docs.docker.com/compose/install/other/#on-linux) and `make`.
Further explainations to these applications are beyond the scope of this document.

TODO add versions


## 1. Download install script

The installation script requires bash to run. Go to a directory of your choice and get it:

```
 wget https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/install.sh
```

## 2. Run installation

```
 bash install.sh
```

Now, your system will get checked to ensure that you have `docker`, `docker-compose` and `make` ready to work.
`make` is not mandatory to run the application, but it helps to input the correct commands. Should you choose to forego `make`
you need to find the necessary commands in the `Makefile`.
Then, you need to put in some parameters for your installation:

* target directory

* hostname

* Database connection parameters (name, root password etc.)

## 3. Run server

The install script allows to start the application after finishing. If you don't or have to stop the application at some
point, you may run the following command to start the application.

```
make run
```
Alternatively to run it without blocking the console with log output:
```
make run-detached
```

Docker will then download and start the containers for all services: frontend, backend and a reverse proxy to handle routing.
To check, go to another computer and put in the host name of the installation - and enjoy!

If you like to stop the server later, run

```
make stop
```

## 4. Login and change super-user password

Right after installation, please log in! At start, you have one user prepared: `super` with password `user123`. Because everyone can read this here and in the scripts, you should get up your shields by changing at least the password (go to "System-Admin").

## 5. Update

Run the script _update.sh_ in the application root directory. It will look to the latest release available and
allows you to update to it. You may also manually enter a release-tag, which will be used if available.

Refer to [GitHub](https://github.com/iqb-berlin/testcenter/releases) to get an overview of available versions.

Alternatively you may also manually edit the file `docker-compose.prod.yml`. Find the lines starting with **image** and edit the version tag at the end.
