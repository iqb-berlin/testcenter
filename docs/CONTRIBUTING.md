# Contributing Guide

This guide is aimed primarily at external institutes and partner
organizations who contribute code on a regular basis. It describes how a
contribution goes from idea to merge.

> Quick summary: Fork/branch → PR against `master` on GitHub (with a
> descriptive summary) → automatic CI check (mirrored to our GitLab
> instance) → review by at least 1 maintainer → merge.

---

## 1. Guiding Principles

- **Reach out early.** Especially for your first contribution or anything
  beyond a small fix, it's a good idea to get in touch with us before you
  start — a short message about what you're planning saves everyone time
  and avoids surprises later. See section 2 for larger changes that require
  a more formal proposal.
- **Small, reviewable changes** are preferable to large, opaque PRs. A PR
  should represent one coherent change, not several unrelated topics at
  once.
- **Discuss before you code** for larger changes (new modules, changes to
  public interfaces, architectural decisions). See section 2.
- **Every contribution goes through review** — regardless of who submits it.
  This isn't about trust, it's quality assurance that benefits everyone
  equally.

---

## 2. Before You Write Code: Proposing Changes

| Scope of change | Approach |
|---|---|
| Bugfix, small improvement, docs, regular feature | Open a PR directly — motivation and approach can go in the **PR description**, a separate issue isn't needed |
| Architecture/interface change, larger refactor, new dependency with far-reaching impact | Open an **RFC issue** first, labeled `rfc`: problem, proposed solution, alternatives, impact on existing users |

The reason for this distinction: a finished PR with several hundred lines
that gets rejected afterward for conceptual reasons is frustrating for
everyone and effort that could have been avoided. For larger undertakings,
a short discussion up front pays off; for everything else, just go ahead.

---

## 3. Workflow in Detail

### 3.1 Repository and Branches

- The current development state lives on `master`. `master` is always
  releasable (CI must be green).
- To contribute: create your own fork (or a feature branch, if you have
  write access to the main repo) and branch off from `master`.
- Branch naming scheme: `feature/<short-description>`,
  `fix/<short-description>`, `docs/<short-description>`.

### 3.2 Pull Requests

- PRs are opened **exclusively on GitHub** — even though CI runs on our
  GitLab instance (see 3.3).
- The PR description should include: *what* was changed, *why*, and if
  relevant, *how it was tested*.
- Reference the related issue, e.g. `#123`. **Please don't use GitHub
  keywords like `Closes #123` or `Fixes #123`** — these auto-close the
  ticket on merge. We close tickets manually on purpose, among other things
  to do a final check before closing that everything is actually done.
- Feel free to open a PR as a **draft** if you'd like early feedback on
  direction before the implementation is finished.
- Updating `CHANGELOG.md` as part of your PR is appreciated but not
  required.

### 3.3 CI: GitHub ↔ GitLab

- Our CI pipeline runs on a private GitLab instance, not GitHub Actions.
  For PRs from the main repo, the state is mirrored automatically and the
  pipeline is triggered; the status shows up as a check directly on the PR
  on GitHub.
- **Process for fork PRs (external contributions)**: the pipeline is not
  triggered automatically for PRs from forks — a maintainer first takes a
  quick look at the PR and then starts the check. Once that's happened, the
  CI status appears as a normal check on your PR, just like for internal
  contributions. You don't need to do anything yourself; it's just possible
  that the check doesn't appear right after opening the PR, but only after
  this brief review.
- A PR is not merged until the pipeline is green — exceptions are decided
  by a maintainer on a case-by-case basis (e.g. a known flaky test).

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
  given PR directly in the PR comments.

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

- **Issues/PRs**: for anything directly related to the code.
- *[Add further channel here, e.g. mailing list / Matrix / recurring call
  between participating institutes — link here if applicable]*
- For questions about getting started or the architecture: see the `docs`
  folder

---

*This document is itself a living document — suggestions for improvement
are always welcome as a PR against this file.*
