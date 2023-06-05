---
layout: default
---

# Installation for production

This installation will download and use pre-built Docker images from a Docker Registry. Docker Compose is used to manage
the images and set up networking, data persistence etc.

## Prerequisites

Before you follow the instructions below, you need to
install [docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods),
[docker-compose](https://docs.docker.com/compose/install/other/#on-linux) and `make`.
Further explainations to these applications are beyond the scope of this document.

## 1. Install

```
wget -O install.sh https://raw.githubusercontent.com/iqb-berlin/testcenter/master/dist-src/install.sh
```
```
bash install.sh
```

The script will try to run `docker`, `docker-compose` and `make` and notify you if it encounters problems with that.
`make` is not mandatory to run the application, but it helps to input the correct commands. Should you choose to forego
`make` you need to find the necessary commands in the `Makefile`.

Then, you need to put in some parameters for your installation. Password presets are randomly generated.

## 2. Run

The install script allows to start the application after finishing. If you don't or have to stop the application at some
point, you may run the following command to start the application.

```
make run
```
Alternatively to run it without blocking the console with log output:
```
make run-detached
```

The application can be stopped with:
```
make stop
```

## 3. Login and change super-user password

After installation two logins are prepared:

- Username `super` and password `user123` as admin user

- Username `test` and password `user123` and code `xxx` as test-taker

**It is strongly advised to at least change the password under "System-Admin".**

## Configuration

### Update

Run the script _update.sh_ in the application root directory. It will look to the latest release available and
allows you to update to it. You may also manually enter a release-tag, which will be used if available.

Refer to the [release section on GitHub](https://github.com/iqb-berlin/testcenter/releases) for available versions.

### TLS

To set up TLS (aka SSL aks https) run the _update.sh_ script and choose the appropriate option. This will also modify
your Makefile with the correct commands.
The certificates need to be placed under _config/certs_ and their name be put in _config/cert_config.yml_.

### Logs

Because the application is managed by Docker, you get logs via Docker. There is a command shortcut fot that:
```
make logs
```
