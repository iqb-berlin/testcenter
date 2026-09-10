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
### Database setup

DB schema set up:
```
make testcenter-init
```
Run this once before the first start. `make testcenter-update` runs it for you as part of an update.

The command is safe to repeat: it applies only what is missing. Because it also reads the workspace files, it is
likewise how you make the application notice files you placed in the data volume by hand.

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

### Database
The database runs as a container inside the application's own network and is not published to the host. It is
configured by three settings in `.env.prod`:

```
DB_DATABASE=iqb_tba_testcenter
DB_USER=iqb_tba_db_user
DB_PASSWORD=<generated during installation>
```

The installation generates the password randomly. Host and port are not configurable: the backend always reaches the
database as `db` on port 5432. The `POSTGRES_*` variables that the database image expects are derived from the three
settings above; do not set them yourself.

`DB_PASSWORD` is only applied while the database is being created, during the very first start. Changing it in
`.env.prod` afterwards does not change the password in the existing database, and the backend can no longer log in.
Change it in both places:

```
make testcenter-connect-db
```
```
ALTER USER iqb_tba_db_user WITH PASSWORD 'new password';
```

Afterwards set the same value in `.env.prod` and restart the application with `make testcenter-restart`.

`make testcenter-connect-db` opens a `psql` prompt in the database container, for this and for any other database
task. It works no matter what `DB_PASSWORD` says, because connections from inside the container need no password.
