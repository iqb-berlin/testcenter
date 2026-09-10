# Contributing Guide

This guide is aimed primarily at external institutes and partner
organizations who contribute code on a regular basis. It describes how a
contribution goes from idea to merge.

Why this guide exists: contributions are most valuable when they don't
create extra work — neither for you nor for us. A finished PR of several
hundred lines that gets rejected afterwards for conceptual reasons is
frustrating for everyone and effort that could have been avoided. Knowing
the workflow up front means your change lands in a predictable way, reviews
stay short, and nobody spends time on work that was never going to be
merged.

> **Quick summary**
> **Your part:** (for larger changes: discuss first →) fork or branch →
> open a PR against `master` on GitHub with a descriptive summary.
> **Our part:** trigger the CI pipeline → review by at least one
> maintainer → merge.

---

## 1. Guiding Principles

- **The product direction stays with IQB.** Testcenter is used by many
  institutes, and keeping it coherent and maintainable in the long run is
  our responsibility as its maintainer. The decision about what becomes
  part of the product therefore rests with us — which is also why we'd
  rather hear about your plans early: it's the easiest way to make sure
  your work goes in a direction we can merge.
- **Reach out early.** Especially for your first contribution or anything
  beyond a small fix, it's a good idea to get in touch with us before you
  start — a short message about what you're planning saves everyone time
  and avoids surprises later. See section 2 for larger changes that require
  a more formal proposal.
- **Small, reviewable changes** are preferable to large, opaque PRs. A PR
  should represent one coherent change, not several unrelated topics at
  once. Please make sure the change stays readable and understandable for
  someone who didn't write it, and split your work into logical units —
  either as separate commits within one PR, or as several connected PRs if
  the topics can stand on their own.
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

### 3.1 Issues

- If you want to report a bug or suggest a feature, please use one of our
  [issue templates](https://github.com/iqb-berlin/testcenter/issues/new/choose).
- For small changes and anything that doesn't need discussion, an issue is
  **not** required (see section 2): a PR with a good description is enough.

### 3.2 Repository and Branches

- The current development state lives on `master`. `master` is always
  releasable (CI must be green).
- To contribute: create your own fork (or a feature branch, if you have
  write access to the main repo) and branch off from `master`.

### 3.3 Pull Requests

- PRs are opened **exclusively on GitHub**.
- Our CI pipeline **cannot run on forks**. For the checks to run, a
  maintainer has to create a branch for your changes in the main
  repository; only then can your commits receive the CI checkmark. This
  happens once the review process starts, so don't be surprised if no
  check shows up right after you open the PR — you don't need to do
  anything yourself.
- The PR description should include *what* was changed, *why*, and *how it was tested*.
- Reference the related issue, e.g. `#123`. **Please don't use GitHub
  keywords like `Closes #123` or `Fixes #123`** — these auto-close the
  ticket on merge. We close tickets manually on purpose, among other things
  to do a final check before closing that everything is actually done.
- Feel free to open a PR as a **draft** if you'd like early feedback on
  direction before the implementation is finished.
- Updating `CHANGELOG.md` as part of your PR is appreciated but not
  required.

### 3.4 Review

- At least **one approval from a maintainer** is required to merge.
- Reviewers check: correctness, adherence to coding standards (see 4),
  tests, clarity, and impact on existing users/institutes.
- Our reviewer capacity is limited, so a review can occasionally take a
  while. We aim to respond in a timely manner, but ask for your
  understanding if it sometimes takes longer. A brief, friendly reminder on
  the PR is completely fine if nothing has happened for a while.
- If `master` has moved on, we don't expect you to keep your branch
  continuously up to date. An update is only needed when your branch
  actually conflicts with `master`, or when the CI checks have to run
  against the current state. Keeping the PR mergeable is the contributor's
  responsibility — for small or simple cases, a maintainer may just do it
  directly instead.
- **Rebasing onto `master` is what we prefer** for feature branches, so
  that merge commits don't pollute the history. Merging `master` into your
  branch isn't forbidden though — if that makes life easier on a particular
  branch, go ahead.
- **As soon as other people commit to your branch** — a reviewer pushing a
  fix, for instance — rebasing and rewriting history is a no-go, since it
  can silently drop or duplicate their work. From that point on, please
  merge or get in contact.

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
- *TODO: further channels (e.g. mailing list / Matrix / recurring call
  between participating institutes) are not decided yet — link them here
  once they are.*

---

*This document is itself a living document — suggestions for improvement
are always welcome as a PR against this file.*