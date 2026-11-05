# Widgets – re-implementation plan

Branch `widgets`, started from master on 2026-11-05 (after the two fixes by Nam
Du: c20b5f881 player messages, 9a833cd27 shared parameters).
Reference: branch `widget3` (Nam's original implementation, left untouched).
Take over code from there only where it holds up in review.
One reviewable commit per step; squash at the end if preferred.

## How we work on this

- The feature was taken over from Nam Du; the goal is to understand it fully.
  Explain the issue and the proposed solution for each step before
  implementing.
- When there are several reasonable solutions, ask instead of picking one.
- Already done on master (pushed): the two bugfixes from `widget3` were
  re-done in slimmed-down form (the sender filter / late-state WeakMap from
  `056cc73b8` was dropped as unnecessary). When taking over unithost code from
  `widget3`, build on master's version, not on `056cc73b8`.

## Background

Three widgets exist:
- Periodic table and molecule editor: opened by the player (`vopWidgetCall`).
  The player passes state in, gets the result back (`vopWidgetReturn`) and
  shows it itself.
- Calculator: opened by the testcenter from the toolbar, configured per testlet
  in the booklet (`<Calculator>`, booklet XSD 18.1). No player involved, so the
  testcenter keeps its state and shows the result (preview window).
  There is no player-opened calculator, so drop everything on `widget3` that
  handles one (`CalculatorService.supports()` in unithost, `CALC` alias,
  calculator logging in the player path).

Widget runtime = the frontend part that runs a widget it is given (HTML,
parameters, state): window, message exchange, lifecycle. It does not fetch the
widget itself and knows nothing about specific models.

## Steps

Backend
1. Recognize widgets: metadata type `widget` + model, DB column + migration,
   new metadata schema URL, model in workspace file list.
   Changelog "Technisches" (DB, API).
2. Check widgets at upload: reject widgets whose Verona/metadata version the
   testcenter can't run (on `widget3` these checks run only in the browser,
   `widgetName()` in widget-start.util.ts).

Widget runtime (frontend, no visible feature yet)
3. Message exchange (`WidgetSession`): ready, start, state changes, return,
   session id, timeout. Plain logic, unit tested without UI.
4. Widget window: movable dialog with iframe and sizing. Nam's sizing logic is
   large; work out what's actually needed (iPad problem, #1652) and simplify.
5. Lifecycle: one widget at a time; close on unit change, pause, leaving the
   test, logout; focus handling; remembered window positions. Takes the widget
   HTML as input.

First usable version
6. Temporary delivery behind a small interface ("give me the widget for model
   X"), backed by `widget3`'s approach for now (workspace-wide `widgets` list in
   `GET /test`, download on click). Mark clearly as temporary.
7. Player integration: `vopWidgetCall` -> runtime -> `vopWidgetReturn`, shared
   parameters from widgets, custom texts for the window. After this, periodic
   table and molecule editor work end to end.

Toolbar calculator
8. Configuration: parse `<Calculator>` in the booklet; backend check of the
   journal JSON at upload.
9. Button and state: open via the runtime, testcenter keeps the state, custom
   texts.
10. Logging: `CALCULATOR_*` unit log entries, docs in docs/site/pages/logging.md.
11. Result preview: movable window with the last calculation.

Wrap-up
12. Changelog entries, maybe an e2e test, squash.

## Open decisions

- Delivery (step 6): workspace-wide lookup + download on click, or units declare
  the widget models they use (upload check, file relations, preloading like
  players). Postponed; a colleague has been asked how it's supposed to work.
- Window sizing approach (step 4).
- Keep the generator script that builds the TS interface from booklet.json
  (`scripts/create-calculator-interface.js` on `widget3`)? (step 8)
- Calculator state: per unit or per testlet, and should it survive a reload?
  (step 9)

## Other notes from the review of widget3

- definitions/booklet/booklet.json: Calculator description still says the XSD
  version is unpublished; 18.1 is published and contains `CalculatorType`.
- Changelog on `widget3` lists widget sizing fixes (#1652) under
  "Fehlerbehebungen", but widgets were never released; fold into the feature.
- `Workspace::getWidgetResourcePaths()` writes to the cache inside a getter.
