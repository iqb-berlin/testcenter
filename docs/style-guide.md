# Style Guide

Formatting rules are integrated into tooling. It is expected that these have been run and are satisfied. Basics like indentation and line endings come from `.editorconfig`, which your editor applies for you.

## Commit Messages

- Write the subject in the imperative mood ("Add", not "Added" or "Adds"), capitalized and without a trailing period. Keep it short — around 50 characters, and no more than 72 including the tag.
- Separate subject and body with a blank line and wrap the body at 72 characters. Indent continuation lines of list items by two spaces.
- Use the body to explain *why* the change was made and what it does, not how it works — the diff already shows that.
- Reference issues as plain `#123`. Don't use GitHub's closing keywords (`Fixes`, `Closes`, `Resolves`), in commits or in pull request descriptions.

The reasoning behind these rules is spelled out at [cbea.ms/git-commit](https://cbea.ms/git-commit/).

### Tags

Start the subject with a tag naming the area the change is about, e.g. `[be] Fix …`:

| Tag      | Area                                                 |
|----------|------------------------------------------------------|
| `[be]`   | Backend                                              |
| `[fe]`   | Frontend                                             |
| `[bs]`   | Broadcaster                                          |
| `[fs]`   | File server                                          |
| `[db]`   | Database schema                                      |
| `[e2e]`  | End-to-end tests                                     |
| `[docs]` | Documentation, including instructions for AI agents  |
| `[ci]`   | CI pipelines                                         |
| `[ops]`  | Docker images, Compose, installer, Helm, Makefiles   |

- A change to several areas gets adjacent tags in the order of the table: `[be][fe]`.
- Tests and documentation that come with a change get no tag of their own. A change that consists only of tests or documentation gets the tag of its area, e.g. `[be]` for backend unit tests.
- If no tag fits, use none.
- Tags name areas, never features or projects. Group the commits of a project by its branch, pull request or issue.

## Backend (PHP)

Checked with [mago](https://mago.carthage.software), configured in `backend/mago.toml`. It runs in the dev backend container: `make test-backend-static-analysis args=lint` or `args=analyze`. The existing code still has many findings, so check that your change adds none. The code is not formatted with mago.

- Every file declares `strict_types=1`, and types are expressed with PHP's native type hints.
- Use phpDocumentor-style docblocks only where native type hints fall short — in practice whenever arrays appear in a function signature, or whenever values are read out of an array.
- Prefer static functions — we aim for a functional style where the problem allows it.
- Use enums and classes as value objects rather than passing primitives around.

## Frontend (Angular)

Linted with ESLint, configured in `eslint.config.mjs` in the repository root.

- For small components, keep template and styles inline. Separate files only when readability demands them.
- In HTML, don't break the line after a tag. Keep everything on one line until it reaches 80 characters.
- Order HTML attributes as follows:
  1. structural directives
  2. IDs, classes, ARIA labels
  3. inputs
  4. outputs
- Use declarative colors and font sizes instead of hex codes.
- Don't add `get foo()` accessors. Use a plain field, or a method that says what it does.

*Suggestions for improvement are welcome*

