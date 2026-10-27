# Developer's Guide

Before your first pull request, read the [Contributing Guide](contributing) and the [style guide](style-guide).

## Architecture

The application consists of these services, each in its own container:

- **`traefik`** (Traefik) – the reverse proxy that receives all requests, terminates TLS and passes them to the
  frontend.
- **`frontend`** (Angular, `frontend/`) – the web application for test takers, group monitors and administrators. It
  is also the only entry point: it forwards `/api/` to the backend, `/fs/` to the file server and `/bs/` to the
  broadcaster. In the development setup the Angular development server does this (`frontend/proxy.conf.json`), in
  production nginx (`frontend/nginx.conf`).
- **`backend`** (PHP with Slim, `backend/`) – the HTTP API. It validates and stores the uploaded test files in the
  workspaces and is the only service with access to the database, where it keeps logins, sessions, responses and
  logs. It tells the broadcaster about every change of a test session.
- **`broadcaster`** (NestJS, `broadcaster/`) – keeps websocket connections to the browsers. It pushes session changes
  to the group monitors and the monitors' commands, such as pausing a test, to the test takers. Optional: without it
  the frontend polls instead.
- **`file-server`** (nginx, `file-server/`) – delivers the test resources, e.g. players and unit contents, straight
  from the backend's workspace files, so large downloads bypass PHP. It only delivers files to logged-in users,
  which it checks against access data the backend stores in the cache service. Optional: without it the backend
  delivers the files.
- **`cache-server`** (Redis) – access data for the file server, the count of failed monitor logins and, optionally,
  cached files.
- **`db`** (PostgreSQL) – the database. Its schema and patches are in `scripts/database/`.

Other folders:

- `definitions/` – booklet parameters, test modes, custom texts and supported XML schema versions as JSON
- `common/` – TypeScript code shared by frontend and broadcaster
- `sampledata/` – the sample workspace every installation starts with
- `e2e/` – Cypress tests of the whole application
- `docs/` – this website, the API description (`docs/api/`) and the repository documentation

## Tests

| Service           | Type                              | Command                                    | Tool    |
|-------------------|-----------------------------------|--------------------------------------------|---------|
| Backend           | Unit tests                        | `make test-backend-unit`                   | PHPUnit |
| Backend           | API against `docs/api/`           | `make test-backend-api`                    | Dredd   |
| Backend           | Installation and database patches | `make test-backend-initialization-general` | Bash    |
| Frontend          | Unit tests                        | `make test-frontend-unit`                  | Karma   |
| Broadcaster       | Unit tests                        | `make test-broadcaster-unit`               | Jest    |
| File server       | API                               | `make test-file-server-api`                | Dredd   |
| Whole application | End to end                        | `make test-system-headless`                | Cypress |
| Whole application | End to end, interactive           | `make test-system`                         | Cypress |

## Linting

| Code                          | Command                                                           | Tool   |
|-------------------------------|-------------------------------------------------------------------|--------|
| Backend                       | `make test-backend-static-analysis args=lint` (or `args=analyze`) | Mago   |
| All JavaScript and TypeScript | `npx eslint <path>` in the repository root                        | ESLint |

Existing code may have findings, so check that your change adds none.

## Database changes

Schema changes for the next release go into `scripts/database/next.sql` and into `scripts/database/full.sql`. Apply
`next.sql` to the development database with `make apply-next-db-patch`. Details:
[database.md](https://github.com/iqb-berlin/testcenter/blob/master/docs/agent/database.md).

## Debugging

The development backend has Xdebug on port 9003 with the IDE key `IDEA`. It starts on request, so set the trigger with
a browser extension such as [Xdebug helper](https://github.com/lhall-adexos/xdebug-ext).
