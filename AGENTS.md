- When implementing features or bugfixes also add documentation about it in the file docs/CHANGELOG.md. user facing changes at the top.
  - Leave a note under "Technisches" only if the change matters to people operating or extending a
    deployment of this project from the outside - e.g. API changes, database/schema changes,
    deployment/config changes, new or changed environment variables, updated dependencies. Do not
    add a note there for internal implementation details - frontend implementation details
    (refactors, internal service/component wiring, etc.) never qualify, even if the change is
    "breaking" for a fork's custom patches; those are already visible to codebase contributors via
    commit messages and diffs.
- When planning or implementing solutions, don't just fix the symptoms. Try to find the root cause.
- When other parts of the code do not allow a clean solution, do not work around that. Propose infrastrucure changes that allow for a clean solution.
- If there a multiple solutions for a problem ask which one to take instead of quietly picking one.

## Test commands

Tests are executed within Docker context - called via make. If these are not granular enough, use your sandbox to run. Dont assume php or node to be installed locally.

| Scope | Command |
| --- | --- |
| One backend test file | `make test-backend-unit target=workspace/ReportTest.php` |
| One backend test directory | `make test-backend-unit target=workspace` |
| All backend unit tests | `make test-backend-unit` |
| Backend API tests | `make test-backend-api` |
| Frontend unit tests | `make test-frontend-unit` |
| Broadcaster unit tests | `make test-broadcaster-unit` |
| One End-to-End test file | `make test-system-headless spec=Test-Controller/hot-return` |
| All End-to-End tests | `make test-system-headless` |

Backend API Test does not create an isolated environment by itself. Watch out.

For focused frontend lint (static code checks), replace the example paths below with the changed files:

```sh
docker compose --env-file .env.dev \
  --file docker-compose.yml \
  --file docker-compose.dev.yml \
  --file test/docker-compose.api-test.yml \
  run --rm --no-deps task-runner-backend \
  node_modules/.bin/eslint \
  frontend/src/app/sys-check/welcome/welcome.component.ts \
  frontend/src/app/sys-check/sys-check-data.service.ts
```
