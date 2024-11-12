---
layout: default
---

# Installation for production

This installation will download and use pre-built Docker images from a Docker Registry. Docker Compose is used to manage
the images and set up networking, data persistence etc.

## Prerequisites

### Required software
- [Docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods)
- [Docker Compose](https://docs.docker.com/compose/install/other/#on-linux)

### Optional software
- [Make](https://www.gnu.org/software/make/)

Make-scripts are used to control the app, i.e. starting, stopping. This can be done manually as well.

## Installation
- Download the installation script from the release page of the version you want to install.
You can find the latest release [here](https://github.com/iqb-berlin/testcenter/releases/latest).

- Run script
```
bash install.sh
```

## Usage
### Start & Stop
Run application in background
```
make testcenter-up
```
Run application with log infos in foreground
```
make testcenter-up-fg
```
Stop application
```
make testcenter-stop
```
Show log output
```
make testcenter-logs
```

### Update

To update your installation to the lastest release, run
```
make testcenter-update
```
from the installation directory.

### Login

After installation two logins are prepared:

- Username `super` and password `user123` as admin user

- Username `test` and password `user123` and code `xxx` as test-taker

**It is strongly advised to at least change the password under "System-Admin".**

## Configuration
Settings can be manipulated in the file `.env`.

### TLS
TLS Certificates can be managed manually or via a ACME provider like "Let's Encrypt" or "Sectigo".
If you choose to use an ACME provider, the install process will ask for all necessary configuration data and fill in the `.env` file and create additional config files.
If managed manually, the TLS certificate must be named `certificate.pem` and TLS Private Key must be named `private_key.pem` and both need to be placed in the folder _/secrets/traefik/certs_. 
If no certificates are configured, self-signed certificates are generated and used. This may cause a browser warning.
