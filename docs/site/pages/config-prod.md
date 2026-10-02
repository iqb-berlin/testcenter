# Configuration for production

Settings can be manipulated in the file `.env.prod`.
Check after every update of the testcenter version, whether new configurations have been added to the 
`.env.prod-template` file, and consider adding them to your `.env.prod` file.

## TLS
TLS Certificates can be managed manually or via a ACME provider like "Let's Encrypt" or "Sectigo".
If you choose to use an ACME provider, the install process will ask for all necessary configuration data and fill in the `.env` file and create additional config files.
If managed manually, the TLS certificate must be named `certificate.pem` and TLS Private Key must be named `private_key.pem` and both need to be placed in the folder _/secrets/traefik/certs_.
If no certificates are configured, self-signed certificates are generated and used. This may cause a browser warning.

## Database
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

## Cache service
The cache service is a Redis container (`cache-server`) inside the application's own network. It serves three purposes:

- The file server checks every download of test resources against the group tokens the backend stores there.
- Logins in the modes `monitor-group` and `monitor-study` are locked after 5 failed login attempts, until 30 minutes
  have passed since the last failed attempt. The backend counts the attempts in the cache service.
- With `REDIS_CACHE_FILES=true`, the file server also keeps whole files there.

It is configured in `.env.prod`:

```
REDIS_PASSWORD=<generated during installation>
REDIS_MEMORY_MAX=1gb
REDIS_CACHE_FILES=false
```

Host and port are not configurable: the backend and the file server always reach the cache service as `cache-server`
on port 6379.

The file server can be switched off with `FILE_SERVER_ENABLED=false`; the backend then delivers test resources itself.
Only in that case can the backend run without the cache service, by leaving `REDIS_PASSWORD` empty. Failed login
attempts are then not counted, so monitor logins are not locked.
