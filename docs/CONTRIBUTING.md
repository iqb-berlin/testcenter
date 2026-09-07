# Contributing Guide

This guide is aimed primarily at external institutes and partner
organizations who contribute code on a regular basis. It describes how a
contribution goes from idea to merge.
TODO: Warum gibt es diesen Guide? (Mehrarbeit vermeiden, effiziente Arbeitsabläufe für alle, etc.)

> Quick summary: (For big changes: Discuss →) Fork/branch → PR against `master` on GitHub (with a
> descriptive summary) → _automatic CI check (mirrored to our GitLab
> instance) → review by at least 1 maintainer → merge_.

---

## 1. Guiding Principles

- **IQB möchte entscheiden** TODO  
- **Reach out early.** Especially for your first contribution or anything
  beyond a small fix, it's a good idea to get in touch with us before you
  start — a short message about what you're planning saves everyone time
  and avoids surprises later. See section 2 for larger changes that require
  a more formal proposal.
- **Small, reviewable changes** are preferable to large, opaque PRs. A PR
  should represent one coherent change, not several unrelated topics at
  once. TODO: Please divide large PRs into smaller commits for easier review.
- **Discuss before you code** for larger changes (new modules, changes to
  public interfaces, architectural decisions). See section 2.
- **Every external contribution goes through review.**

---

## 2. Before You Write Code: Proposing Changes

| Scope of change | Approach |
|---|---|
| Bugfix, small improvement, docs, regular feature | Open a PR directly — motivation and approach can go in the **PR description**, a separate issue isn't needed |
| Architecture/interface change, larger refactor, new dependency with far-reaching impact | Open an **RFC issue** first, labeled `rfc`: problem, proposed solution, alternatives, impact on existing users |

---

## 3. Workflow in Detail

TODO: ### 3.1 Vorarbeiten

- Issue anlegen (mit richtigem Template)

### 3.2 Repository and Branches

- The current development state lives on `master`. `master` is always
  releasable (CI must be green).
- To contribute: create your own fork (or a feature branch, if you have
  write access to the main repo) and branch off from `master`.

### 3.3 Pull Requests

- PRs are opened **exclusively on GitHub** — CI is manually triggered by 
  the maintainers when the review process starts and turns green. Once that's happened, the
  CI status appears as a normal check on your PR, just like for internal
  contributions. (TODO)
- The PR description should include *what* was changed, *why*, and *how it was tested*.
- Reference the related issue, e.g. `#123`. **Please don't use GitHub
  keywords like `Closes #123` or `Fixes #123`** — these auto-close the
  ticket on merge. We close tickets manually on purpose, among other things
  to do a final check before closing that everything is actually done.
- Feel free to open a PR as a **draft** if you'd like early feedback on
  direction before the implementation is finished.
- Updating `CHANGELOG.md` as part of your PR is appreciated but not
  required. TODO: Diesen Teil rausnehmen und extra Dokument on how to code ?

### 3.4 Review

- At least **one approval from a maintainer** is required to merge.
- Reviewers check: correctness, adherence to coding standards (see 4),
  tests, clarity, and impact on existing users/institutes.
- Our reviewer capacity is limited, so a review can occasionally take a
  while. We aim to respond in a timely manner, but ask for your
  understanding if it sometimes takes longer. A brief, friendly reminder on
  the PR is completely fine if nothing has happened for a while.
- If `master` has moved on and your branch develops conflicts, we'll ask you
  to bring it up to date — for small or simple cases, a maintainer may just
  do this directly instead. **Rebasing onto `master` is recommended**, but
  merging `master` into your branch is fine too. One thing to watch out
  for: once a maintainer or someone else has started working on your
  branch, please avoid rebasing from that point on, since it rewrites
  history and can silently drop or duplicate their changes — a merge is the
  safer choice at that point. Feel free to work out the specifics for a
  given PR directly in the PR comments. TODO: nochmal diskutieren: Wer hat am Ende weniger Schmerz? Vielleicht auch in der Runde 

---

## 4. Coding Standards

- A document with our coding standards is in progress and will be linked
  here soon.
- Please run formatting and linting locally before pushing.
- New functionality needs **tests**; bugfixes should ideally include a
  regression test.
- Public interfaces (APIs, CLI, configuration formats) are documented —
  flag any changes to these explicitly in the PR.

---

## 5. Commit Messages

- For commit messages, we follow the recommendations at
  [cbea.ms/git-commit](https://cbea.ms/git-commit/).

---

## 6. Communication

- **Issues**: for anything related to the functionality/feature. 
- **PRs**: for anything directly related to the code.
- *[Add further channel here, e.g. mailing list / Matrix / recurring call
  between participating institutes — link here if applicable]*

---

*This document is itself a living document — suggestions for improvement
are always welcome as a PR against this file.*
