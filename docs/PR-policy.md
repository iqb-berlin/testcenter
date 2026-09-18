# PR policy

This document collects bespoke workflows and checklists that are required before a pull request is considered complete and ready for human review. It focuses on objectively reviewable artefacts. For code style and project taste, consult the appropriate AGENTS.md file in each module and the files under docs/agents.

## Database changes

- When creating a new table in `scripts/patches.d`, add it to the tables array in `backend/src/dao/DAO.class.php`. Keep referenced tables before tables that use them as foreign keys.
- When creating a SQL patch in `scripts/patches.d`, update `backend/test/unit/testdata.sql` with any fields that have seed-worthy data. It contains `INSERT` statements only, not table definitions.

## API changes

- When you change a property of an object a DAO returns, trace whether a controller passes that property on to the client. If it does, update the corresponding API specification in `docs/api`.

