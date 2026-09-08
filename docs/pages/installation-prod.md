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

### Backup and restore

An installation keeps its state in two places: the **database** (accounts, logins, test results) and the **data
files** (units, booklets, testtaker files, resources). A backup is only usable if both halves come from the same
moment, so back them up together:

```
make testcenter-backup
```

This writes one timestamped backup set into the installation directory, e.g.:

```
backup/2026-09-08T10-42-00Z/
├── iqb_tba_testcenter.sql   # the database
├── backend_vol.tar.gz       # the data files
└── manifest                 # version, database name, checksums of both artifacts
```

The application may keep running while a backup is taken.

To restore a backup set, name it:

```
make testcenter-restore BACKUP=backup/2026-09-08T10-42-00Z
make testcenter-up
```

The restore checks the manifest first and refuses to start if an artifact is damaged or missing. It then stops the
application, replaces both halves, and leaves the application stopped so you can start it yourself. Restoring
**replaces** the data files: anything not contained in the backup is gone afterwards.

`make testcenter-update` takes such a backup set of its own before it changes anything, and it can be restored with
the same command.

#### Disaster recovery on a new machine

1. Install the same release the backup set was taken with (the release is recorded in the manifest; the restore warns
   if it does not match).
2. Copy the backup set into the `backup` directory of the new installation.
3. Run `make testcenter-restore BACKUP=backup/<set>`, then `make testcenter-up`.

#### What a backup set does not contain

Your configuration - `.env.prod`, `config/` and `secrets/` - is not part of a backup set. Keep a copy of those
separately; without them a new installation cannot be reached under the same host name and TLS certificates.

#### Restoring only one half

`testcenter-dump-db`, `testcenter-restore-db`, `testcenter-export-backend-vol` and `testcenter-import-backend-vol`
work on a single half, by default in `backup/temp`, and accept `BACKUP=` like the commands above. Be aware that a
database and data files from different moments do not match: workspaces whose content is missing stay empty, and the
application says so during start-up.

### Login

After installation two logins are prepared:

- Username `super` and password `user123` as admin user

- Username `test` and password `user123` and code `xxx` as test-taker

**It is strongly advised to at least change the password under "System-Admin".**

## Configuration
Settings can be manipulated in the file `.env.prod`.
Check after every update of the testcenter version, whether new configurations have been added to the 
`.env.prod-template` file, and consider adding them to your `.env.prod` file.

### TLS
TLS Certificates can be managed manually or via a ACME provider like "Let's Encrypt" or "Sectigo".
If you choose to use an ACME provider, the install process will ask for all necessary configuration data and fill in the `.env` file and create additional config files.
If managed manually, the TLS certificate must be named `certificate.pem` and TLS Private Key must be named `private_key.pem` and both need to be placed in the folder _/secrets/traefik/certs_. 
If no certificates are configured, self-signed certificates are generated and used. This may cause a browser warning.
