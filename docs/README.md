# Documentation

This folder holds two kinds of documentation:

- **The documentation website** (`site/`) for people who install, configure and use the Testcenter,
  including the API reference. It is published at https://pages.cms.hu-berlin.de/iqb/testcenter/.
- **Repository documentation** (all other files), mostly for people who develop or release the
  Testcenter. It is not part of the website and is read here in the repository or on GitHub.

## Folders and files

- `site/` – the documentation website, built with [VitePress](https://vitepress.dev/)
  - `index.md` – start page
  - `pages/` – all pages, written by hand
  - `.vitepress/config.mjs` – site settings and sidebar
  - `.vitepress/theme/` – version menu and outdated notice
  - `public/` – files copied to the site as they are, e.g. `versions.json` for the version menu
  - `generated/` – written by `npm run generate`, do not edit
- `scripts/` – tooling for the website
- `api/` – OpenAPI description of the backend API; source of the API reference on the website and of
  the API tests
- `agent/` – background knowledge written for coding agents, useful for developers too
- all other files – repository documentation (changelog, contribution and release guides, …)

## Publishing

The CI pipeline of a release tag builds the website and deploys it twice: below its minor version
(e.g. `/testcenter/19.0/`), which later patch releases replace, and, for the highest release, also
unprefixed as the latest version. The version menu lists the versions from `site/public/versions.json`
of the latest deployment; `release_process.md` says when to update it.

## Usage

- `npm install` here and in the repository root (the API step uses the root's scripts)
- `npm run dev` – serve the site with hot reload
- `npm run build` – build the site into `site/.vitepress/dist`
- `npm run preview` – serve the built site

`dev` is enough for writing. `build` is what the CI runs and fails on dead links, so run it before
pushing, and use `preview` to check the result as it will be published (base path, search, version
menu). `DOCS_PREFIX=19.0 npm run build` builds the site as it is deployed below a minor version.

## Generated content

Some parts of the website are generated from the code, so they always match it. To change such a
part, change its source, not the page.

- booklet parameters (`booklet-config.md`) – `definitions/booklet/booklet-config.json`
- test modes (`test-mode.md`) – `definitions/testtaker/test-mode.json` and `mode-options.json`
- custom texts (`custom-texts.md`) – `definitions/testtaker/custom-texts.json`
- group monitor states (`test-session-super-states.md`) –
  `frontend/src/app/group-monitor/test-session/super-states.ts` and the frontend's icon sprite
- API reference – `api/*.spec.yml`

`npm run generate` (`scripts/generate.js`) writes the Markdown parts into `site/generated/`, and the
pages include them with `<!--@include: ../generated/<name>.md-->`. `npm run api` merges
`api/*.spec.yml` and builds the API reference with Redocly into `site/public/api/`. `npm run dev` and
`npm run build` run both first.

## Adding a page

- put a Markdown file into `site/pages/`
- add it to the sidebar in `site/.vitepress/config.mjs`
- link to files outside `site/` (e.g. `CONTRIBUTING.md`) with their GitHub URL
