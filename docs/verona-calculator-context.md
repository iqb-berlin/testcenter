# Testcenter-owned calculator: iterative implementation guide

Research and implementation date: 2026-10-15.

## 1. Requirements and specification

Testcenter will provide a calculator button during test execution. A new direct
child of `<Testlet>` will control its visibility with `show="yes"` or `show="no"` and supply its
configuration. The calculator uses the existing widget modal, handshake, state
handling, and lifecycle. Testcenter initiates the call. There is no requesting
player and no `vopWidgetReturn`.

Calculator delivery uses uploaded workspace resources, as approved on 2026-10-15.
Both metadata models `CALCULATOR` and `CALC` are accepted. Prefer `CALCULATOR`
and fall back to `CALC` only when no resource is available under the preferred name.
Implement one requested iteration at a time.

The [calculator specification](https://iqb-specifications.github.io/concepts/plugins/widget.html#taschenrechner)
describes `CALC` version 1.1:

| Parameter | Values | Default |
| --- | --- | --- |
| `MODE` | `SIMPLE` or `SCIENTIFIC` | `SIMPLE` |
| `JOURNAL_LINES` | Zero hides history; positive values set the displayed line count | `"0"` |
| `MAX_IMAGE_WIDTH_PX` | Positive integer, maximum result-image width | `"200"` |
| `JOURNAL` | Serialized JSON array of previous calculations | `"[]"` |

Journal entries contain `asLatex` and `asImage`. Images use base64-encoded JPG or
PNG data. The last entry is the newest. The calculator defines no shared
parameters. Configuration values travel as strings in the widget parameter array.

The calculator model version and communication-interface version are separate.
Continue using the [Widget interface 1.0.1](https://verona-interfaces.github.io/widget/)
for ready, start, state, and close messages. That interface was rechecked during
iteration 1. Its wire messages and validation rules are unchanged. The calculator
specification details above come from the supplied research plan; recheck them
when selecting an implementation.

## 2. Starting point and constraints

Read the [widget context](verona-widget-context.md) and
[implementation handoff](verona-widget-handoff.md). Their historical sections
describe earlier stages. The starting implementation is committed through
`ff30e70f8`.

- `WidgetService` selects and downloads uploaded resources, coordinates the modal,
  restores focus, and stores state in memory by resource path.
- `WidgetSession` handles the handshake, source and session checks, timestamp
  ordering, state updates, and return requests.
- `WidgetDialogComponent` owns the iframe and dialog presentation.
- Previously, both the launch API and session depended on a player call. Iteration
  1 separates widget execution from the caller without fabricating a player.

Preserve these behaviors throughout later iterations:

- One active widget, including loading; existing loading and error views; the
  15-second ready timeout; modal accessibility and background blocking.
- Timers continue. Unit changes, pause, termination, logout, destruction, and
  competing dialogs close the widget without restoring focus to a departing view.
- State remains in memory for the run. Cancellation retains accepted updates.
  Reset and destruction clear the cache.
- Explicit state overrides cached state, including `''`. Empty state, final-return
  state, timestamp ordering, duplicate messages, and teardown retain their existing
  semantics. Do not add resets on testlet or mode changes.
- Existing player-widget returns and late player-state routing remain intact.

Booklet uploads validate against the published XSD. The checked 18.0 schema does
not allow a calculator child under `<Testlet>`. Updating the frontend parser or a
local schema fixture alone cannot enable valid uploads.

The supplied `iqb-widget-calc-0.1.0.html` declares model `CALCULATOR` and embedded
version `1.0.0`. This differs from the specification's `CALC` name and the filename's
version. Research found code reading `JOURNAL_LINES` and `MAX_IMAGE_WIDTH_PX`;
complete configuration support still needs verification.

## 3. Decision gates

The XML contract and nested-testlet behavior were approved on 2026-10-15.
Other recommendations remain proposals. Record each answer before the affected iteration.

| Gate | Decision needed | Recommendation |
| --- | --- | --- |
| Delivery | **Approved:** uploaded workspace resource using existing authenticated delivery. | Keep the existing last-file policy within each model. No bundled calculator. |
| Module identity | **Approved:** `CALCULATOR` and `CALC` are aliases. | Prefer `CALCULATOR`, then `CALC`; accept either in ready metadata. Other models remain exact. |
| XML contract | **Approved:** one optional `<Calculator show="yes|no" mode="SIMPLE|SCIENTIFIC" journalLines="0" maxImageWidthPx="200">` per `<Testlet>`, required `show` accepting only `yes` or `no`, optional `<Journal>` containing the JSON array; omitted configuration settings use specification defaults. | Hidden when no declaration applies. Schema extension is implemented locally for proposed release 18.1; publication is pending. |
| Nested testlets | **Approved:** nearest complete declaration. | All descendants inherit the nearest complete declaration automatically. A child declaration replaces it entirely, including `show="no"` to disable availability; settings are not merged. |
| Journal initialization | **Approved:** always send authored `JOURNAL` as a parameter; restore accepted state separately. | Do not seed or replace cached state to compensate for module limitations. The module interprets parameters and state. |
| Button and unavailable module | **Approved:** direct header button beside the reload/fullscreen menu. | Visibility follows effective `show="yes"` while the current unit is ready and the test is running. Missing uploads open the existing actionable error. |

### Approved visibility and inheritance contract

Use `show="yes"` or `show="no"`, replacing the earlier proposed `enabled`
attribute and its `y` or `n` values. Descendants automatically inherit the complete
calculator configuration unless they declare their own `<Calculator>` element.
A local declaration replaces the inherited configuration as a whole. Omitted
configuration settings use specification defaults, not ancestor values.

```xml
<Testlet id="outer">
  <Calculator show="yes" mode="SCIENTIFIC" journalLines="5"/>
  <Testlet id="inherits">
    <Unit id="task1" label="Scientific calculator with five journal lines"/>
  </Testlet>
  <Testlet id="disabled">
    <Calculator show="no"/>
    <Unit id="task2" label="No calculator"/>
  </Testlet>
  <Testlet id="overrides">
    <Calculator show="yes"/>
    <Unit id="task3" label="Simple calculator with no journal lines"/>
  </Testlet>
</Testlet>
```

A deeper descendant of `disabled` can enable the calculator again with its own
`<Calculator show="yes"/>`. When no declaration applies, the calculator is hidden.
`show` is required on every declaration and accepts only `yes` or `no`.
Omit the entire `<Calculator>` element to inherit the ancestor configuration.

## 4. Implementation iterations

### Iteration 1: support a host caller in the existing runtime

Implemented, with verification recorded below. This iteration does not expose a
calculator button in production or choose calculator delivery.

`WidgetSession` now takes `model` and `parameters` directly. It has no player-call
identity. Player parsing, requester validation, discovery, and return construction
stay in `WidgetService.open()`.

A host caller supplies a resolved resource path, the exact expected metadata model,
string-valued parameters, and its focus target:

```typescript
widgets.openHost({
  resourcePath,
  model,
  parameters,
  trigger: calculatorButton
});
```

The optional `state` field retains the existing explicit-state precedence. Omit it
to restore cached state. The runtime does not interpret journal data.

Both launch paths use the same authenticated resource download, modal,
`WidgetSession`, run-memory cache, and teardown. This API accepts an already
resolved resource path and performs no calculator discovery. Its use of the
existing download path establishes the runtime behavior; it does not settle the
calculator delivery gate. A later delivery choice must supply execution inputs
without adding delivery logic to `WidgetSession`.

The common runtime accepts final state before closing. Only the player launch
installs a player-return callback. Host launches never send `vopWidgetReturn`,
whether `saveState` is true, false, or omitted. Ordinary closure restores focus to
the connected host button. Forced closure retains the existing focus rules.

The browser fixture is `frontend/src/app/test-controller/services/widget.service.spec.ts`.
It launches through an Angular button, executes downloaded `srcdoc`, exchanges real
browser messages, closes, restores focus, and reopens with accepted state. It needs
no player iframe or player session. Other focused checks cover final-only empty
state, cancellation across units, reset, competing dialogs, removed buttons,
download failure, and forced transitions during loading and execution.

### Iteration 2: settle and implement the booklet contract

XML and nested-testlet gates are approved. The published XSD extension and its
release selection are still required.

- Coordinate a published XSD extension, select its release, and align compatibility
  declarations and local test schemas.
- Update `definitions/booklet/booklet.json`; regenerate with `make create-interfaces`.
- Parse declarations into typed configuration at the XML boundary. Resolve the
  effective configuration while ancestor context is available.
- Account for Testcontroller and group-monitor consumers of the shared parser.
  Preserve existing booklet compatibility.

Done when declarations survive real upload validation and parsing, malformed
declarations produce useful errors, and nested examples match the approved rules.

### Iteration 3: provide the calculator implementation

Uploaded-resource delivery and both calculator identities are approved and
implemented. Verification and API usage are recorded below. No calculator artifact
is bundled or pinned; each workspace supplies its implementation.

Uploaded resources reuse authenticated workspace discovery and delivery. The
temporary last-file policy is approved for this step. `CALCULATOR` takes priority
over `CALC`, independently of modification time across those two model groups.

Loading and selection remain outside `WidgetSession`. Bundled delivery is not
part of the approved implementation.

Resolve the implementation into the common execution inputs. Verify its actual
configuration support. Done when the approved artifact loads through its real
delivery path and missing or incompatible implementations produce clear errors.

### Iteration 4: connect configuration to the calculator button

Implemented on 2026-10-16 with header placement and parameter handling approved
by the user. Verification is recorded below.

- Derive visibility from the current unit's effective testlet configuration.
- Convert configuration into the widget's string-valued parameter array.
- Implement the approved journal-initialization rule.
- Recheck eligibility when opening; share the active-dialog restriction.
- Keep state in the existing run-memory lifecycle.

Done when enabled and disabled testlets behave correctly, configuration reaches the
calculator, and reopening restores accepted state without a player return.

### Iteration 5: verify and document the complete feature

- Exercise the selected calculator in a real browser.
- Add author-facing XML examples covering nesting, defaults, provisioning, and
  state lifetime.
- Add a user-facing changelog entry at the top. Use `Technisches` only for externally
  relevant schema, deployment, configuration, dependency, or API changes.
- Update public API documentation only where its contract changes.

## 5. Acceptance checks and handoff

Across the relevant iterations, check:

- Visibility `y`, `n`, absent declarations, nested overrides, existing booklets.
- Both modes, numeric configuration boundaries, journal initialization.
- Host launch without a player request or session.
- State notifications, final-only and empty state, cancellation, reopening across
  units, and no player return for any `saveState` value.
- Focus restoration, background blocking, repeated clicks, forced closure during
  loading and execution.
- Wrong source/session, stale and duplicate messages, timeout, download failure.
- No database persistence of widget state or leakage into another run.
- Existing player-widget behavior and late player-state routing.

Run focused checks for each iteration. After runtime integration, run the
test-controller suite and production build. Run backend unit and API checks when
schema validation or backend behavior changes. Update this document after each
iteration with decisions, status, verification, and the next unresolved gate.
Recheck external specifications before changing protocol behavior. Preserve
unrelated local changes.

### Iteration 1 verification

All 130 test-controller tests passed in Chromium, including the 21 new host-launch
checks and the existing player-widget and late-state routing tests. The production
build passed. It reported the existing CommonJS optimization warnings for
`@iqb/responses`, `semver`, and `@iqbspecs/coding-scheme`. The four changed/new
TypeScript files passed ESLint, and `git diff --check` passed.

Commands from `frontend`:

```bash
PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng test --watch=false \
  --include='src/app/test-controller/**/*.spec.ts'

PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng build --configuration=production \
  --output-path=/tmp/testcenter-calculator-host-build
```

Karma requires permission to bind its local port outside the filesystem sandbox.
The test log is `/tmp/calculator-host-tests-approved.log`; the build log is
`/tmp/calculator-host-build.log`. Browser fixtures verify the host runtime,
not compatibility with the supplied calculator artifact. No backend or schema
code changed in this iteration.

The XSD extension is prepared locally for proposed release 18.1. Publication is
on hold. The frontend parser is now implemented independently, as recorded below.
Production uploads with active schema validation still require publication and
schema integration. `show` is required.
Delivery and module identity can be decided separately for iteration 3.

### Source reconciliation

At the start of this implementation, HEAD was still `ff30e70f8`. The iteration 1
implementation and browser fixture described above were absent, despite the
previous completion record in this document. This session implemented the host
launch API and caller-independent session, then ran the verification again.
The calculator button, XML parser, and delivery selection remain for later iterations.

### Iteration 2, schema step

The schema change is prepared in the separate local checkout
`/home/oem/IdeaProjects/testcenter-booklet-xml`, branch `calculator-xml`, based on
upstream `main` at `2fb8456`. Proposed release: 18.1. It has not been committed,
pushed, or released. The authenticated GitHub account has read access but no push
permission on `iqb-specifications/testcenter-booklet-xml`.

The XSD allows one optional `<Calculator>` per `<Testlet>`, after optional
`<Restrictions>` and before units or child testlets. It requires `show="yes|no"`,
provides `mode="SIMPLE"`, `journalLines="0"`, and `maxImageWidthPx="200"` defaults,
and accepts one optional text-only `<Journal>`. `journalLines` is nonnegative;
`maxImageWidthPx` is positive. No calculator declaration is allowed directly under
`<Units>`. Existing booklets without a calculator remain valid.

The upstream JSON documentation schema, README, nested XML example, changelog,
and Python validation CI are updated in that checkout. Eight test groups cover
legacy documents, mandatory visibility, modes, numeric boundaries, XSD defaults,
journal structure, placement, duplicates, nesting, and the JSON documentation
schema. All eight groups pass. All 94 existing sample booklets that validate
against published 18.0 also validate against the extended XSD. Documentation
generation with `npm run generate_docs` passed; the generated output contains the
calculator contract. The XSD retains its existing CRLF line endings. Its whitespace
check uses `core.whitespace` with `cr-at-eol`. Run the schema tests with:

```bash
/tmp/booklet-schema-tests/bin/python -m unittest discover \
  -s /home/oem/IdeaProjects/testcenter-booklet-xml/test -p 'test_*.py' -v
```

XSD 1.0 does not parse JSON or resolve inheritance. Journal JSON validation and
whole-declaration inheritance still need implementation and runtime tests in the
Testcenter parser. Testcenter compatibility declarations, local schema fixtures,
interfaces, and parser are unchanged in this schema-only step. Real calculator
uploads remain unavailable until the new schema is published and integrated.


### Iteration 2, parser step

Implemented on 2026-10-15 after schema publication was put on hold. The user will
manage development validation settings separately. This step does not change
`.env.dev`, validation behavior, compatibility declarations, or XSD fixtures.

- `definitions/booklet/booklet.json` declares the experimental calculator element.
  It remains marked as requiring an upcoming XSD release, not a feature of the
  published 18.0 schema.
- `scripts/create-calculator-interface.js` is part of `make create-interfaces`.
  It derives `CalculatorConfiguration`, allowed values, defaults, and numeric
  minima in `common/src/interfaces/calculator.interfaces.ts` from that definition.
- The shared parser stores optional, effective `calculator` configuration on each
  testlet. Units in the Testcontroller access it through `unit.parent.calculator`.
  Booklets without declarations keep their existing object shape.
- The immediate parent's already-resolved configuration is inherited. A local
  declaration replaces every field, including journal content. Missing fields use
  defaults. Explicit `show="no"` remains an inherited configuration and can be
  replaced by a deeper `show="yes"` declaration.
- Parsing validates mandatory visibility, modes, safe whole-number ranges,
  declaration placement and cardinality, unknown attributes, and journal JSON.
  Each journal entry requires string `asLatex` and `asImage` values. The original
  decoded XML text is retained without parsing image data or changing entry order.
  Widget state, cache keys, reset rules, and journal startup precedence are unchanged.
- Errors use the existing XML error contract and include testlet context when the
  declaration has a valid testlet location. The group-monitor adapter retains its
  existing `{ error: 'xml', species: null }` result for malformed booklets.

Author reference: [Calculator configuration](calculator-configuration.md).

Verification: 247 tests passed in Chromium, including 101 new checks through both
real parser adapters. Eight existing group-monitor tests remain skipped. The
production build passed with the existing CommonJS warnings for `@iqb/responses`,
`semver`, and `@iqbspecs/coding-scheme`. `make create-interfaces` passed.
The generated calculator interface reproduces identically on repeated runs.
New files pass ESLint. The three modified legacy files retain existing diagnostics
on unchanged lines; changed lines have no diagnostics. Both staged and unstaged
whitespace checks pass.

Commands from `frontend`:

```bash
PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng test --watch=false \
  --include='src/app/shared/services/booklet-parser.service.spec.ts' \
  --include='src/app/test-controller/**/*.spec.ts' \
  --include='src/app/group-monitor/**/*.spec.ts'

PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng build --configuration=production \
  --output-path=/tmp/testcenter-calculator-parser-build
```

Logs: `/tmp/calculator-parser-tests.log`, `/tmp/calculator-parser-build.log`, and
`/tmp/calculator-create-interfaces.log`. Lint details are in
`/tmp/calculator-parser-new-lint.log` and
`/tmp/calculator-parser-lint-baseline.json`. Backend checks are not applicable to this
frontend-only step. Delivery and model identity were the next step at this
snapshot and are implemented below. The calculator button and authored startup
parameters remain for iteration 4; no calculator button is exposed yet.


### Iteration 3, uploaded-resource delivery and calculator aliases

Decisions approved on 2026-10-15:

- Deliver the calculator as an uploaded workspace resource, like other widgets.
- Accept both uppercase model names `CALCULATOR` and `CALC` during discovery and
  ready validation. Prefer `CALCULATOR`; fall back to `CALC` only when the first
  model has no resource. Within the selected model, use its last backend-ordered
  file. Lowercase names and unrelated widget models are not calculator aliases.

`widgetModelCandidates()` owns this preference and equivalence. Both
`TestControllerService.getWidgetResourcePath()` and ready metadata validation use
it. Other models retain exact matching. A resource inherited from the map's
prototype is ignored. No backend response or resource ordering changed.

The host launch method now resolves the resource itself:

```typescript
widgets.openCalculator({ parameters, trigger });
```

It accepts string-valued widget parameters and optional explicit state, just like
`openHost()`, and then uses that shared runtime. `CALCULATOR` is the expected
identity, with `CALC` accepted as an alias. The actual resource path remains the
state-cache key. Host launches send no player return. Player calls using either
calculator name also resolve through the same preference and preserve the
requesting player's return identity.

Missing resources open a modal with instructions to inform the test lead and
upload a `CALCULATOR` or `CALC` widget. No download starts. Download and startup
failures use the existing error views. A failure of the selected file does not
silently switch to another resource. Active-dialog restrictions, ready timeout,
focus restoration, loading cancellation, and run-memory state use the existing
runtime. The API does not yet derive parameters or visibility from booklet
configuration. The toolbar button remains for iteration 4.

The supplied `iqb-widget-calc-0.1.0.html` was exercised in Chromium as-is through
`srcdoc`, ready/start messages, and explicit state restoration. It declares
`CALCULATOR`, embedded version `1.0.0`. Browser runs confirmed that journal entries
sent as `state` restore calculator content. The `MODE` parameter has no code
reference and SIMPLE/SCIENTIFIC runs produced the same controls. The standalone
`JOURNAL` parameter has no code reference and did not initialize content. This
artifact reads `JOURNAL_LINES` and `MAX_IMAGE_WIDTH_PX`, but exact history layout
and generated-image dimensions were not measured. No artifact was modified or
bundled, and full configuration compatibility is not claimed.

Browser evidence is in `/tmp/calculator-artifact-{simple,scientific-journal,restored-state}.html`
and the matching `.dom` files. These are manual compatibility checks of the
supplied artifact, not dependencies of the automated test suite.

At this snapshot, the header button and parameter handling were the next step.
The user subsequently approved passing all parameters despite the supplied
module limitations; iteration 4 below records that implementation.


Iteration 3 verification: 279 tests passed in Chromium, including 32 new delivery,
resolution, and alias checks. Eight existing group-monitor tests remain skipped.
The combined run includes all test-controller tests, calculator parser tests, and
group-monitor tests. The production build passed with the existing CommonJS
warnings. The six focused runtime/test files pass ESLint. The two large legacy
controller files retain diagnostics on unchanged lines; changed lines have none.
`git diff --check` passed. No backend, schema, or environment settings changed.

Logs: `/tmp/calculator-delivery-tests.log`, `/tmp/calculator-delivery-build.log`,
`/tmp/calculator-delivery-lint.log`, and `/tmp/calculator-delivery-legacy-lint.json`.

Commands from `frontend`:

```bash
PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng test --watch=false \
  --include='src/app/test-controller/**/*.spec.ts' \
  --include='src/app/shared/services/booklet-parser.service.spec.ts' \
  --include='src/app/group-monitor/**/*.spec.ts'

PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng build --configuration=production \
  --output-path=/tmp/testcenter-calculator-delivery-build
```


### Iteration 4, header button and parameter integration

Implemented on 2026-10-16. The preceding work was committed first as `c532b178a`,
as requested. Header integration is a subsequent working-tree change.

The user selected the same header that contains the reload/fullscreen controls.
The calculator is a directly visible text button beside their overflow menu,
independent of whether reload or fullscreen is enabled. It appears for the current
unit's effective `show="yes"` configuration while the test is RUNNING and the unit
is ready. Hidden, absent, loading, paused, and terminated configurations cannot
launch it. Eligibility is checked again when the button is activated.

`TestControllerComponent.openCalculator()` reads the current effective
configuration and passes `MODE`, `JOURNAL_LINES`, `MAX_IMAGE_WIDTH_PX`, and `JOURNAL`
as string-valued parameters to `WidgetService.openCalculator()`. Authored journal
text is preserved and sent on every launch. The call omits explicit `state`, so
accepted state remains restorable by resource path, including an empty string.
No state is seeded, replaced, or reset to compensate for unsupported parameters.
This follows the user's instruction to pass MODE and JOURNAL even when the current
calculator does not consume them.

The click handler takes the event's native `currentTarget`, not a Material button
component reference. This preserves the existing runtime's native-element focus
restoration and connected-element checks.

The component fixture now loads the actual TestController module, parses nested
booklet examples, and runs the real WidgetService/BackendService/modal/session
with Angular HTTP testing. Eleven header checks cover placement, independent
reload/fullscreen settings, inheritance, disabled and missing declarations,
configured/default parameters in start commands, empty retained state, focus
restoration, missing module feedback, repeated clicks, and forced closure.

Verification: all 289 controller, shared-calculator-parser, and group-monitor
checks passed in Chromium. Eight existing group-monitor tests remain skipped.
The production build passed with the existing CommonJS warnings. The rewritten
component spec passes ESLint; lint findings in the existing production component
are on unchanged lines. `git diff --check` passed. No backend, XSD, compatibility,
or environment settings changed. The schema release remains on hold.

Commands from `frontend`:

```bash
PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng test --watch=false \
  --include='src/app/test-controller/**/*.spec.ts' \
  --include='src/app/shared/services/booklet-parser.service.spec.ts' \
  --include='src/app/group-monitor/**/*.spec.ts'

PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng build --configuration=production \
  --output-path=/tmp/testcenter-calculator-header-build
```

Logs: `/tmp/calculator-header-tests.log`, `/tmp/calculator-header-full-tests.log`,
`/tmp/calculator-header-build.log`, `/tmp/calculator-header-test-lint.log`, and
`/tmp/calculator-header-legacy-lint.json`.


### Calculator artifact 0.2.0 compatibility check

On 2026-10-16 the user supplied `iqb-widget-calc-0.2.0.html`. The artifact was
inspected and exercised without modification in Chromium. No production code,
resource selection, or environment setting changed for this check.

The embedded metadata still declares model `CALCULATOR`, module version `1.0.0`,
Widget interface `1.0`, and metadata version `3.1`, despite the filename's `0.2.0`.
These values are accepted by the existing host validation.

Five browser scenarios verified:

- Ready/start handshake and a final `vowReturnRequested` in all scenarios.
- Explicit `state` restored the journal entry `456=456`; state notification and
  final return preserved that entry.
- Clicking `1`, `+`, `2`, and `=` produced `1+2=3` in both state and final return.
  With `MAX_IMAGE_WIDTH_PX` set to 80 and 400, the returned PNG images had widths
  of 80 and 400 pixels respectively, both with height 56.
- SIMPLE and SCIENTIFIC runs displayed the same controls. The artifact has no
  `MODE` code reference.
- A standalone `JOURNAL` parameter did not initialize entries. Only
  `JOURNAL_LINES` appears in the artifact's code; authored journal content still
  requires widget-side parameter support. Testcenter continues sending MODE and
  JOURNAL unchanged, as already authorized.

The source now renders calculation images through an SVG renderer and converts
them to PNG. The host still receives the documented string fields and needs no
change. Uploading the new file uses the existing workspace-resource delivery
mechanism. A local file alone does not replace an uploaded workspace resource.

Reproduction: `/tmp/check-calculator-020.py`. Browser harnesses and DOM output are
`/tmp/calculator-020-{simple,scientific-journal,state,evaluate-80,evaluate-400}.{html,dom}`.
The compact observation report is `/tmp/calculator-020-results.json`. These checks
exercise the actual artifact; they are not a replacement for the host runtime tests.

### Peek window for the latest calculation

Added on 2026-10-16. The user selected one peek window whose image is replaced by
the next result, retained across calculator-enabled units.

`WidgetService.openCalculator()` reads the latest accepted state after ordinary
modal closure, including the host close button. `WidgetSession` remains unaware
of calculator journals and retains its existing timestamp and final-state rules.
The close callback runs only after modal teardown. Forced closure does not create
or update a peek. The existing accepted-state cache is unchanged.

`calculatorResult()` parses the state at the calculator boundary. Only the final
journal entry is used. Its `asImage` must be a PNG or JPEG Base64 data URL;
`asLatex` supplies the alternative text when present. Malformed state, missing
images, remote URLs, and other image formats are ignored. The existing peek is
retained when no usable new image is supplied. The uploaded 0.2.0 calculator
already returns this format.

`CalculatorPeekComponent` owns expansion and dragging. It renders within the
controller, with a fixed viewport boundary, a draggable title bar, and no backdrop
or focus trap. Pointer events outside the window reach the unit. Closing minimizes
to a fixed taskbar button without a remove action. A new result expands the peek;
ordinary hide/show transitions preserve its minimized state and drag position.
Browser resize resets the position to keep it reachable.
The title bar captures the pointer during a drag so mouse events continue reaching
the host when the pointer crosses the player iframe.

The component remains mounted while temporarily unavailable. Its visibility uses
the same running, loaded-unit, and calculator-configuration gate as the header
button, and it hides during modal dialogs. The result signal belongs to the
controller-scoped widget service. Run reset, authentication changes, and service
destruction clear it. There is no persistent storage and no player-widget return
change.

The controller browser fixture exercises final-only state, host close, stale final
state, result replacement, minimize/reopen focus, dragging, resize, enabled and
disabled units, pause, loading, forced close, and run reset. Parser checks cover
invalid states and unsupported image sources.

Verification: 314 browser checks passed; eight existing group-monitor checks remain
skipped. The production build passed with the existing CommonJS warnings. The six
focused production/test files pass ESLint. Existing lint findings in the legacy
controller component do not touch the changed line. `git diff --check` passed.

A temporary browser harness also ran the actual supplied
`iqb-widget-calc-0.2.0.html` through `WidgetService`, its modal, and the real
ready/start/state/return messages. It calculated `1+2=3`, displayed the returned
400-pixel PNG, accepted typed input in a separate unit iframe while the peek was
expanded, dragged across that iframe, minimized and reopened at the dragged
position, and kept the peek and taskbar within a 360-by-640 viewport. Screenshots
were inspected at both viewport sizes. No browser exceptions occurred.

Logs: `/tmp/calculator-peek-full-tests.log`, `/tmp/calculator-peek-build.log`,
`/tmp/calculator-peek-lint.log`, and `/tmp/calculator-peek-legacy-lint.json`.
The temporary browser check is `/tmp/verify-calculator-peek.py`; its compiled
harness, screenshots, and `report.json` are in
`/tmp/testcenter-calculator-peek-preview/`. These files are local verification
artifacts, not bundled calculator resources or deployment changes.

Commands from `frontend`:

```bash
PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng test --watch=false \
  --include='src/app/test-controller/**/*.spec.ts' \
  --include='src/app/shared/services/booklet-parser.service.spec.ts' \
  --include='src/app/group-monitor/**/*.spec.ts'

PATH=/home/oem/.nvm/versions/node/v22.17.1/bin:$PATH \
  ./node_modules/.bin/ng build --configuration=production \
  --output-path=/tmp/testcenter-calculator-peek-build
```
