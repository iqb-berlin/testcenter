# Documentation

## Folders

- `site/` – the documentation website, built with [VitePress](https://vitepress.dev/)
  - `index.md` – start page
  - `pages/` – all pages, written by hand
  - `.vitepress/config.mjs` – site settings and sidebar
  - `public/` – files copied to the site as they are
  - `generated/` – written by `npm run generate`, do not edit
- `scripts/` – tooling for the documentation
- `api/` – OpenAPI description of the backend API, also used by the API tests
- other files (`CHANGELOG.md`, `CONTRIBUTING.md`, …) are for the repository, not the website

## Usage

- `npm install` here and in the repository root (the API step uses the root's scripts)
- `npm run dev` – serve the site with hot reload
- `npm run build` – build the site into `site/.vitepress/dist`
- `npm run preview` – serve the built site

## Generated content

- `npm run dev` and `npm run build` run both steps below first
- `npm run generate` (`scripts/generate.js`) writes Markdown parts from
  - `definitions/booklet/booklet-config.json`
  - `definitions/testtaker/test-mode.json` and `mode-options.json`
  - `definitions/testtaker/custom-texts.json`
  - `frontend/.../super-states.ts` and the frontend's icon sprite
- the pages include them with `<!--@include: ../generated/<name>.md-->`
- `npm run api` merges `api/*.spec.yml` into `site/public/api/specs.yml` and builds the API reference
  `site/public/api/index.html` with Redocly

## Adding a page

- put a Markdown file into `site/pages/`
- add it to the sidebar in `site/.vitepress/config.mjs`
- link to files outside `site/` (e.g. `CONTRIBUTING.md`) with their GitHub URL
