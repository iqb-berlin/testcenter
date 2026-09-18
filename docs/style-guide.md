# Style Guide

Formatting rules are integrated into tooling. It is expected that these have been run and are satisfied. Basics like indentation and line endings come from `.editorconfig`, which your editor applies for you.

---

## Commit Messages

- Write the subject in the imperative mood ("Add", not "Added" or "Adds"), capitalized and without a trailing period. Keep it short — around 50 characters, and no more than 72 including the tag.
- Separate subject and body with a blank line and wrap the body at 72 characters.
- Use the body to explain *why* the change was made and what it does, not how it works — the diff already shows that.
- Prefix the subject with the part of the project the change is about, in square brackets — for example `[be]`, `[fe]`, `[db]`, `[e2e]`, `[ci]`, `[infra]`, `[docs]`, `[file-server]`. Several tags are combined in one pair of brackets: `[be, fe, docs]`.
- The tag names what the change is *about*, not every directory it touches. A change that belongs to no single part needs no tag.

The reasoning behind these rules is spelled out at [cbea.ms/git-commit](https://cbea.ms/git-commit/).

---

## Backend (PHP)

Linted and formatted with [mago](https://mago.carthage.software), configured in `backend/mago.toml`.

- Every file declares `strict_types=1`, and types are expressed with PHP's native type hints.
- Use phpDocumentor-style docblocks only where native type hints fall short — in practice whenever arrays appear in a function signature, or whenever values are read out of an array.
- Prefer static functions — we aim for a functional style where the problem allows it.
- Use enums and classes as value objects rather than passing primitives around.

---

## Frontend (Angular)

Linted with ESLint, configured under `eslintConfig` in `package.json`.

- For small components, keep template and styles inline. Separate files only when readability demands them.
- In HTML, don't break the line after a tag. Keep everything on one line until it reaches 80 characters.
- Order HTML attributes as follows:
  1. structural directives
  2. IDs, classes, ARIA labels
  3. inputs
  4. outputs
- Use declarative colors and font sizes instead of hex codes.
- Don't add `get foo()` accessors. Use a plain field, or a method that says what it does.

---

*Suggestions for improvement are welcome*

