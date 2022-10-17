---
layout: default
---

# Installation for production

"Production" here means that you just want to install and use the application, not more. You do not like to get a look behind the curtain or to run sophisticated performance analyses. This type of installation has fewer requirements in regard of software and space.

Technically, you download pre-built images from Docker Hub.

## Preconditions

Before you follow the instructions below, you need to
install [docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods),
[docker-compose](https://docs.docker.com/compose/install/) and `make`.
We do not explain these applications, this is beyond the scope of this document.

TODO add versions


## 1. Download install script

The installation script requires bash to run. Go to a directory of your choice and get it:

```

 wget https://raw.githubusercontent.com/iqb-berlin/iqb-scripts/master/install.sh

```

Also download the project specific configuration for the install script:

```

 wget https://raw.githubusercontent.com/iqb-berlin/testcenter-setup/master/config/install_config

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

After you've got "--- INSTALLATION SUCCESSFUL ---", you change into the installation directory and type

```

make run

```

Docker will then start all containers: Frontend, Backends, and one traefik service to handle routing. To check, go to another computer and put in the host name of the installation - and enjoy!

If you like to stop the server later, run

```

make stop

```

## 4. Login and change super-user password

Right after installation, please log in! At start, you have one user prepared: `super` with password `user123`. Because everyone can read this here and in the scripts, you should get up your shields by changing at least the password (go to "System-Admin").

## 5. Update

Run the script _update.sh_ in the root directory. This will compare your local component versions with the latest release and update and restart the software stack.

Alternatively you may also manually edit the file `docker-compose.prod.yml`. Find the lines starting with **image** and edit the version tag at the end.

Check the [IQB Docker Hub Page](https://hub.docker.com/u/iqbberlin) for latest images.