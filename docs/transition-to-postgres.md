---
layout: default
---

# Transition from MySQL to PostgreSQL

Up to the last MySQL release the application stored its data in MySQL. From this release on it uses PostgreSQL.

The update does not convert the old data. It starts with an empty PostgreSQL database and leaves the MySQL volume
untouched on disk. This page describes what that means for an existing Docker Compose installation, what to do
before updating, and how to get back if you have to. New installations are not concerned.

## What happens to your data

An installation keeps its state in two places, and only one of them is the database: the **data files** (units,
booklets, testtaker files, resources) live in their own volume and are not affected by the change. That is why a
large part of an installation comes back by itself.

**Rebuilt automatically on the first start**

- every workspace, under the id it had before
- all files of every workspace
- the test-taker logins, because they are defined in the testtaker files rather than stored independently

**Lost, because it only ever existed in the database**

- test results and responses
- logs, reviews, and started or finished test sessions
- all administrator accounts, including their workspace assignments
- the registration of uploaded assets - the files themselves stay in the data volume, but the application no
  longer knows about them

**Left alone**

- the old MySQL volume `db_vol`. It keeps the old data and it keeps occupying disk space, but nothing in the new
  release can read it.

## Before you update

1. **Export the results you still need.** Afterwards they exist only inside a MySQL dump, which takes a MySQL
   server to read - see [Reading the old data later](#reading-the-old-data-later).
2. **Write down your administrators** and the workspaces each of them may see. You have to create these accounts
   again after the update.
3. **Let the update create its backup.** `make testcenter-update` asks whether to create a data backup; answer yes.

## The update

```
make testcenter-update
```

Before anything is changed, the update of the installed release writes into the installation directory:

```
backup/<date>/<database name>.sql   # a mysqldump - only a MySQL server can read it
backup/<date>/backend_vol.tar.gz    # the data files
backup/release/<old version>/       # a copy of the installation directory
```

The update then renames the database settings in `.env.prod`, keeping their values:

| before | after |
| --- | --- |
| `MYSQL_DATABASE` | `DB_DATABASE` |
| `MYSQL_USER` | `DB_USER` |
| `MYSQL_PASSWORD` | `DB_PASSWORD` |
| `MYSQL_HOST` | `DB_HOST` |
| `MYSQL_PORT` | `DB_PORT` |
| `MYSQL_ROOT_PASSWORD` | removed, no counterpart |
| `MYSQL_BINLOG_EXPIRE_LOGS_SECONDS` | removed, no counterpart |

The new database is therefore created with the same name, user and password as the old one. It is created in a new
volume named `postgres_vol`; `db_vol` is not touched.

## Filling the new database

From this release on, starting the application no longer sets the database up - it only verifies that the schema
matches and refuses to serve otherwise. `make testcenter-update` therefore runs the new step

```
make testcenter-init
```

before it starts anything. This is the step that takes considerably longer than usual here, because it reads every
file of every workspace back into the empty database. It reports what it restores:

```
Orphaned workspace-folder found `ws_1` and restored in DB.
Logins updated: -0 / +37
Sys-Admin "super" created.
```

The update asks at the end whether to restart the installation, and runs this step only if you agree.
If you decline, run `make testcenter-init` yourself before `make testcenter-up` - the backend refuses
to serve until the schema is in place.

## Log in again

All administrator accounts are gone, so a single system administrator is created while the database is filled:

- user `super`
- password: the value of `ADMIN_INIT_PASSWORD` in `.env.prod`, which is `user123` unless you have changed it

**Change this password immediately after the first login**, then create your other administrator accounts again and
assign their workspaces. Until you do, one widely known password is enough to reach every workspace of the
installation.

## Reading the old data later

The dump that the update wrote is a MySQL dump and needs a MySQL server. You can start one temporarily; it has
nothing to do with your installation, so any password will do:

```
docker run --rm --detach --name old-testcenter-db --env MYSQL_ROOT_PASSWORD=secret mysql:8.4
docker exec --interactive old-testcenter-db mysql --user=root --password=secret < backup/2026-09-08/iqb_tba_testcenter.sql
docker exec --interactive --tty old-testcenter-db mysql --user=root --password=secret iqb_tba_testcenter
```

Remove the container with `docker rm --force old-testcenter-db` when you are done. Alternatively, attach the old
volume itself to such a container instead of loading the dump; it is still a complete MySQL data directory.

## Rollback

A rollback is possible as long as `db_vol` still exists and the images of the old release are still available.

```
make testcenter-down
cp -r backup/release/<old version>/. .
make testcenter-up
```

The old release finds `db_vol` unchanged and continues where it left off. Everything entered after the transition
stays behind in `postgres_vol`, invisible to the old release - and still there if you decide to move forward again
later.

## Other deployments

### Helm

The chart runs PostgreSQL on port 5432 and checks it with `pg_isready`. Values and secret keys change:

- the new value `config.db.database` sets the name of the database
- `secret.db.mysqlUser` and `secret.backend.mysqlUser` are replaced by `secret.db.user`
- `secret.db.mysqlPassword` and `secret.backend.mysqlPassword` are replaced by `secret.db.password`
- `secret.db.mysqlRootPassword` is dropped without replacement
- the secret keys `MYSQL_USER` and `MYSQL_PASSWORD` are now `DB_USER` and `DB_PASSWORD`

What happens to the data is the same as under Compose. The chart brings no backup and restore commands of its own,
so secure both volumes with the means of your cluster before you update.

### Custom deployments

- The backend image needs the PHP extension `pdo_pgsql`. `pdo_mysql` is no longer used.
- The database is configured through `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` and `DB_PORT`, as listed
  above. There is no fallback to the old `MYSQL_*` names, and no alternative `POSTGRES_*` names.

## What changes for API clients

Two fields are passed through from the database unchanged and therefore carry the PostgreSQL format from now on:
`reviewtime` in `GET /test/{test_id}/reviews` and `GET /test/{test_id}/unit/{unit_name}/reviews`, and `createdAt`
in the asset list.

```
MySQL:      2021-07-29 10:00:00
PostgreSQL: 2021-07-29 10:00:00+00
            2021-07-29 10:00:00.744751+00
```

The value carries a UTC offset now, and up to six fractional-second digits when they are not zero. Clients have to
evaluate the offset: it is not guaranteed to be `+00`, but follows the time zone of the database session.

Asset file names are also compared case-sensitively from now on. Uploading `logo.png` when `Logo.png` already
exists creates a second asset, where MySQL replaced the existing one. Names that differ only in capitalisation
therefore no longer overwrite each other.

## Troubleshooting

**The backend never becomes healthy and its container restarts again and again.**
Look at `make testcenter-logs`. If it says *"The database holds no Testcenter schema"* or names a schema version
other than the one the release requires, the database step was skipped - run `make testcenter-init`.
Otherwise check that `.env.prod` contains `DB_DATABASE`, `DB_USER` and `DB_PASSWORD`. If it still has the `MYSQL_*`
names, the migration did not run; rename the keys as listed above and restart with `make testcenter-restart`.

**The log says "Workspaces exist in the database, but the data directory holds no workspace folder".**
The data volume is empty, so the workspaces were not rebuilt from their files. Restore the data files from
`backup/<date>/backend_vol.tar.gz` before you continue, or upload the workspace content again.

**A workspace has fewer files than before.**
Files that do not pass validation are not registered. The first start reports them, so look for
`Invalid files found` in the log of that start and fix the files it names.

**The old data still occupies disk space.**
That is `db_vol`. `docker volume ls` shows it under the name of your Compose project, e.g.
`testcenter_db_vol`. Once you are certain that you no longer need it - and that the dump is archived somewhere
safe - remove it with `docker volume rm testcenter_db_vol`. This cannot be undone, and it makes a rollback
impossible.
