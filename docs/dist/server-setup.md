# More server setup and handling

## SSL

For a setup using SSL certificates (HTTPS connection), the certificates need to be placed under _config/certs_ and their name be put in _config/cert_config.yml_.

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


