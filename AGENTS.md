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
- Existing code is not an argument for new code. "It is already done this way elsewhere" only counts if that pattern is good on its own merits; do not carry earlier bad practices into new development.
- Do not change production code just to make tests work (e.g. branches only the test environment takes). Adapt the test setup or test infrastructure instead.
- Commit subjects start with a tag in square brackets naming the area the change is about, e.g. `[be] Fix …`.
  - Tags: `[be]` backend, `[fe]` frontend, `[e2e]` end-to-end tests, `[docs]` documentation, `[db]` database,
    `[bs]` broadcasting service, `[fs]` file server, `[ci]` CI pipelines, `[infra]` Docker images and deployment,
    `[helm]` helm chart, `[xsd]` XML schemas, `[ai]` instructions and config for AI coding agents.
  - Several areas: adjacent tags, `[be][fe]`. Tests and docs that come with a change get no tag of their own.
  - Do not use other tags. Ask first if none of these fits.
- Wrap commit message bodies so no line exceeds 72 characters; indent continuation lines of list items by two spaces.
- Reference issues as plain `#123`; never use GitHub closing keywords (`Fixes`, `Closes`, `Resolves`) in commits or PR descriptions.

