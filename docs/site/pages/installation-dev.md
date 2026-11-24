# Installation for development

The development setup runs the Testcenter from its source code in Docker containers. The source folders of frontend,
backend and broadcaster are mounted into the containers, so changes to the code take effect without rebuilding the
images.

This guide assumes you are familiar with git, a Unix shell and Docker. The steps are written for Linux.

::: warning
This setup is not safe for production use: its configuration contains publicly known passwords. For production, follow
the [installation for production](installation-prod).
:::

## Prerequisites

* [Docker](https://docs.docker.com/engine/install/) with the [Compose plugin](https://docs.docker.com/compose/install/linux/)
* Make

Only for linting, building the documentation and the interactive end-to-end tests (`make test-system`) you also need
[Node.js](https://nodejs.org/) 22 with npm. Run `npm install` in the repository root, and for the documentation also in
`docs/`, see its [README](https://github.com/iqb-berlin/testcenter/blob/master/docs/README.md).

## 1. Install

```
git clone https://github.com/iqb-berlin/testcenter.git
```

## 2. Configure

```
make init
```

This creates the configuration files `.env.dev` for the containers and `frontend/src/environments/environment.ts` for
the frontend.

## 3. Run

```
make build
```

Builds the images of all services. To build only one service, add it as a parameter, e.g. `service=backend`.

```
make init-backend
```

Installs the database schema, applies new database patches and reads the files in the workspaces. Run it again after
pulling changes that bring new database patches: the backend refuses to start until they are applied.

```
make up
```

Creates and starts all containers. To start only one service, add it as a parameter, e.g. `service=backend`.
The application runs in the foreground and is reachable under http://localhost. Stop it with Ctrl+C or `make down`.

::: warning
The frontend's development server reports port 8080 in the log, but that port is only reachable inside the container
network. Open the application under http://localhost.
:::

## 4. Run with S3 storage

For development, you can use a local S3-compatible service (SeaweedFS) instead of the filesystem for storing workspace files.

```
make up LOCAL_S3=true
```

This starts all containers plus a SeaweedFS container that provides S3-compatible storage. Files are stored in a bucket named `testcenter` and served directly from the S3 endpoint at `http://localhost:8333`.

::: warning
With S3 storage, browsers load files directly from the S3 endpoint. Ensure port 8333 (S3 API) and 23646 (Admin UI) are available on your machine.
:::

The S3 service provides an admin interface at http://localhost:23646. Log in with username `admin` and password `testcenter` to browse the bucket contents.

To verify the S3 setup:
1. Access the admin interface at http://localhost:23646
2. Log in with `admin` / `testcenter`
3. Check that the bucket `testcenter` exists and contains a `data/` directory

To switch back to filesystem storage:
```
make down
make up
```

## Login

After installation two logins are prepared:

- Username `super` and password `user123` as admin user
- Username `test` and password `user123` and code `xxx` as test-taker
