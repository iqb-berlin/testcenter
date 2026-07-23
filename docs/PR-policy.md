# PR policy

This document collects bespoke workflows and checklists that are required before a pull request is considered complete and ready for human review. It focuses on objectively reviewable artefacts. For code style and project taste, consult the appropriate AGENTS.md file in each module.

## Deployment changes

Whenever anything deployment-related (eg. .env files, Docker compose, nginx.conf, angular.json) is changed, apply the same changes the Kubernetes deployment files in `scripts/helm/testcenter` and corresponding `scripts/helm/testcenter/values.yaml`

## Generated documentation and interfaces

When touching any JSON file in `definitions`, regenerate the associated documentation and interfaces:

```sh
make update-docs
make create-interfaces
```

## Database changes

- When creating a new table in `scripts/patches.d`, add it to the tables array in `backend/src/dao/DAO.class.php`. Keep referenced tables before tables that use them as foreign keys.
- When creating a SQL patch in `scripts/patches.d`, update `backend/test/unit/testdata.sql` with any fields that have seed-worthy data. It contains `INSERT` statements only, not table definitions.

## Changelog

Before opening a PR, add an entry to `CHANGELOG.md`.

## Static code analysis

- for backend tooling, run `make test-backend-static-analysis args=` for the different tools at disposal (format, lint, analyze)
- for frontend, run `npm run lint`
- these static code checks will be enabled and blocking in the CI Pipeline at a later point

## Tests

- have sufficient tests to secure the committed changes (e2e tests, unit tests, api tests)
- 
