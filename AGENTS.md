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

