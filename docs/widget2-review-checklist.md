# widget2 review handoff checklist

This document records an assessment of an external review of `widget2`.
The initial scope was reading and assessment. The user later approved the priority 3 calculator service separation.
Unchecked items are recommendations for evaluation, not approved implementation choices.

The initial review examined production code and sampled tests without running them.
The priority 3 implementation below includes a test run.

## Snapshot and interpretation

- [x] Assess the review against branch `widget2` at `aee77436c21ce8c6e7582f4e8fa708a52db6cd7d`.
- [x] Record the export snapshot: `350c18402e436134717c72d80ca19bdddc4eac68`, on 2026-10-21.
- [x] Account for the change between these snapshots: `DBSchema::REQUIRED_VERSION` now equals `18.3.0`.
- [ ] Read applicable `AGENTS.md` instructions before any implementation.
- [ ] Reassess relevant code if the branch changes after the export snapshot.
- [ ] Ask the user to choose when several implementation solutions remain viable, as required by `AGENTS.md`.
- [ ] Add user-facing changes to `docs/CHANGELOG.md` when implementing features or fixes.

Checked boxes record completed assessment or resolved findings. Unchecked boxes record remaining evaluation or work.


## Priority 4: Decide the sizing contract

- [ ] Assess sizing cost with realistic widget documents and frequent DOM updates.
- [ ] Present viable sizing choices before replacing the existing behavior.
- [ ] Establish the protocol and widget changes required if widgets will report their dimensions.
- [ ] Make sure that any simpler strategy handles narrow screens, dynamic panels, and nested clipped content.
- [ ] Preserve drag, resize, viewport bounds, proportional scaling, and stable initial display where required.

`WidgetFrameSizer` changes dimensions, measures layout, and scans HTML descendants.
It observes subtree changes, attributes, and text. Frequently updated widgets can trigger repeated measurements.
`requestAnimationFrame` combines scheduled fits, so each mutation does not immediately cause a separate fit.
The performance concern is credible, but this assessment did not measure a slowdown.
Fixed dimensions per model are not an established replacement. Reported dimensions require widget support.

Reference: [frame sizing](../frontend/src/app/test-controller/components/widget-dialog/widget-frame-sizer.class.ts).

## Secondary work

- [x] Delete the two committed agent context documents, as requested.
- [x] Assess cache work during `GET /test`. The user expects about five widgets at most per workspace and accepts the cache work at that scale. No optimization is planned.
- [x] Account for cache configuration. Cache hits refresh expiry without reading the file from disk. File caching can be disabled, in which case `storeFile()` returns immediately.
- [x] Use the existing custom-text mechanism for widget loading and error messages, window controls, the calculator button, the missing-calculator message, and result previews. Widget-supplied names and calculator formulas remain unchanged.
- [x] Replace calculator upload instructions in the test window with a message that asks the participant to inform the test lead.
- [x] Assess the shared white background separately from the calculator theme. White is a dialog surface choice, not a requirement for calculator content. See the assessment below.
- [x] Reword the eight affected commit subjects on `widget2` after `master`. All branch subjects now use allowed tags and contain no Markdown bold markers or `[common]` tag. File snapshots and commit bodies are unchanged.
- [x] Define window size limits once in `widget-window.constants.ts` for dialog creation, automatic sizing, and manual resizing. Name the 15-second ready timeout `WIDGET_READY_TIMEOUT_MS`. Values remain unchanged.
- [ ] Align error language and own-property checks during related cleanup.

The shared dialog forces white on its host, the Material dialog surface, and the loading card.
These styles affect window controls, loading and error messages, and areas visible around widget content.
They do not replace an explicit background inside the widget iframe. Transparent widget content can show the white surface behind it.

The calculator has a separate rule: `CalculatorService.createBehavior()` requests `colorScheme: 'light'`.
The dialog applies that value inside the iframe before widget scripts run. Generic widgets receive no such override.
Changing the shared dialog background therefore does not remove the calculator's light-theme rule.

Testcenter currently sets its own color scheme to light. This assessment found no demonstrated contrast failure in that configuration.
Using `--mat-sys-surface` and `--mat-sys-on-surface` for the shared window and loading card is the recommended alternative to fixed white.
Keeping white is also possible as an explicit presentation choice. No production styles changed during this assessment.
The result preview's white image background is separate from the shared widget dialog.

References: [resource enumeration](../backend/src/workspace/Workspace.class.php),
[cache service](../backend/src/helper/CacheService.class.php),
[global styles](../frontend/src/styles.css),
[dialog styles and iframe theme](../frontend/src/app/test-controller/components/widget-dialog/widget-dialog.component.ts),
[calculator theme](../frontend/src/app/test-controller/services/calculator.service.ts),
[application theme](../frontend/src/theme/index.scss).

## Review claims that need correction or qualification

- [x] Reject the `1.0.1` startup-failure example as evidence against `specVersion === '1.0'`.
  Verona metadata uses `MAJOR.MINOR`. Interface release `1.0.1` does not imply metadata containing `1.0.1`.
  See the [official metadata schema](https://raw.githubusercontent.com/verona-interfaces/verona-module-metadata/master/verona-module-metadata.schema.json).
- [ ] Assess upload/runtime compatibility alignment and clearer errors independently of that incorrect version example.
- [x] Reject the claim that five files implement the same validation.
  They handle player calls, widget events, XML configuration, calculator results, and session/source identity.
  Similar TypeScript type checks do not establish duplicated business logic.
- [ ] Assess the actual overlap in parameter validation. Start parameters and incoming shared parameters currently use different rules.
- [ ] Choose a validation library only if a concrete maintenance benefit justifies it. The review does not establish that need.
- [x] Reject the statement that both bug fixes still need separate commits.
  Late-state preservation already has commit `892652393`, titled `[fe] Preserve late player state and startup errors`.
  The shared-parameter fix remains inside integration commit `808c29777`.
- [ ] Assess whether extracting the shared-parameter fix improves reviewability. It directly enables widget parameter updates.
- [ ] Preserve player source filtering and late-state handling when restructuring message routing.
  Widget and player messages share the same message stream, so those changes are related to integration correctness.
- [x] Treat HTML reserialization as a compatibility concern, not a demonstrated markup failure.
  A wrapper style or iframe attribute alone does not establish that an explicit widget body theme is overridden before scripts execute.
- [x] Record that no no-getters rule appears in the supplied or applicable `AGENTS.md` files.
  The calculator getter performs a small constant amount of work. `windowBounds` measures layout when accessed.
- [ ] Establish lifecycle ownership before removing repeated close calls.
  Destruction, player replacement, and unit/state changes can cover different events.
- [x] Reject spec line count as evidence that tests only mirror implementation.
  Sampled tests exercise real iframe handshakes, outgoing state on unload, focus, cancellation, journal isolation, and rendered sizing.
- [x] Accept workspace rereading as a migration cost, not an independent defect.
  The pending SQL clears workspace hashes to reread metadata. The changelog already describes that behavior.

## Handoff outcome

- [x] Complete the requested assessment without implementing changes.
- [x] Export the assessment as this Markdown checklist.
- [ ] Obtain the next implementation scope and any required design choices from the user.

Recommended order: migration consistency, supported XSD configuration, calculator separation, then sizing.
Documentation and commit cleanup follow those decisions. A validation-library rewrite remains optional.
