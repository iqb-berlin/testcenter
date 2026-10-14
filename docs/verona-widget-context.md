# Verona widgets in Testcenter: context for iterative implementation

Research date: 2026-10-13, Europe/Berlin.

Latest handoff: [Verona widget handoff after HTML download](verona-widget-handoff.md), written on 2026-10-14. It records completed work, current Studio Lite overlay research, recommendations, and open choices. Historical "future steps" statements below describe the state at their respective snapshot dates.

Purpose: a reference handoff for a new session. This document records the requested feature, verified source facts, differences between sources, and open decisions. It does not authorize implementation of the entire feature.

## 1. User request and working rules

The eventual feature runs Verona widgets while a test participant uses the Testcontroller.

- A player requests a widget through `vopWidgetCall`.
- Testcenter resolves and loads the widget HTML into a separate iframe.
- A modal overlay covers the application and interrupts participant interaction with the player and the rest of the test system.
- Testcenter implements the host side of the Widget interface, including the ready/start handshake, state notifications, and return request.
- When the widget sends `vowReturnRequested`, Testcenter closes the overlay and sends `vopWidgetReturn` when the protocol requests a return.
- Widget state stays in memory across units within the same test run under `/t/...`.
- Do not persist widget state in the database in this iteration. Database persistence may be added later.
- Use the player testbed and Studio Lite as implementation references. Copy useful structure and fixes, while correcting differences from the current specifications.
- The supplied HTML widgets are examples. Their interfaces may be outdated, while their structure is expected to remain substantially the same.

The user requested context collection only. Implement changes later, one explicit prompt at a time. Do not turn this document into permission to perform all suggested steps.

Source precedence set by the user:

1. Widget interface 1.0.1.
2. The prose in widget-docs.
3. The example widget HTML.

Use the current Player specification for player messages. Fetch documentation freshly when revisiting protocol decisions. Pstack skills are welcome where useful.

Repository instructions:

- Find root causes. Propose infrastructure changes when current infrastructure cannot support a clean solution.
- Ask the user when there are multiple meaningful solutions. This handoff intentionally leaves those choices open.
- Do not treat existing patterns as proof that they are good.
- Do not change production behavior solely to accommodate tests. Repair test setup instead.
- When implementing, add a user-facing entry at the top of `docs/CHANGELOG.md` under `# next` and `## Neue Funktionen`.
- Add a `Technisches` entry only for externally relevant API, schema, configuration, deployment, environment-variable, or dependency changes. Internal frontend wiring does not qualify.
- Commit subjects use the approved area tags, such as `[fe]` or `[be][fe]`. Accompanying tests and docs do not get extra tags.
- Wrap commit body lines at 72 characters. Reference issues as plain `#123`, without closing keywords.
- Read the applicable `AGENTS.md` files again in a new session.

Frontend instructions also prefer inline templates/styles for small components, HTML lines up to 80 characters, the specified attribute order, and declarative colors/font sizes.

Backend instructions require PHP 8.3 with strict typing, PHPDoc for array contracts, and tracing DAO changes through controllers to the public API documentation. Run `make test-backend-api` for backend API changes.

## 2. Snapshot and provenance

Local repository:

- Workspace: `/home/oem/IdeaProjects/testcenter2`.
- Branch: `widget2`.
- HEAD: `ee2ab9ab64bd91209ef8534bbe6005838024e46d`.
- Root package version: 19.0.0.
- Angular packages: approximately 20.3.7; CDK/Material approximately 20.2.10.
- TypeScript: approximately 5.8.3, with strict TypeScript and Angular template checking.
- Configured Verona Player major-version range: 2 through 6.
- There were no tracked modifications at the start of research.
- Existing untracked content includes `CONTEXT.md`, the three supplied widget HTML files, IDE files, scripts, backups, and other documents. Preserve it. Do not overwrite `CONTEXT.md`.

Official documentation was retrieved through live HTTPS GETs with unique query parameters and `Cache-Control: no-cache, no-store` plus `Pragma: no-cache`. The generated schema objects in the published `js/app.js` files were also read, in addition to the repository YAML. This avoids relying on the web tool's previously crawled page alone.

Verified on 2026-10-13:

| Source | Version / snapshot | Fresh-response Last-Modified |
| --- | --- | --- |
| [Player documentation](https://verona-interfaces.github.io/player/) | 6.3.0 | 2026-05-20 12:04:04 UTC |
| [Widget documentation](https://verona-interfaces.github.io/widget/) | 1.0.1 | 2026-10-08 09:15:53 UTC |
| [Widget prose](https://verona-interfaces.github.io/widget-docs/) | Published prose, site marked deprecated | 2026-10-09 09:44:11 UTC |
| [Player schema source](https://github.com/verona-interfaces/player/blob/72cf5931b3eef24cb1f76fcd19a2d1020a3b7ab2/playerapi.yaml) | `72cf5931b3eef24cb1f76fcd19a2d1020a3b7ab2` | Commit 2026-05-20 |
| [Widget schema source](https://github.com/verona-interfaces/widget/blob/cf497922181a126430ac28350d5ce66636d71ca5/widgetapi.yaml) | `cf497922181a126430ac28350d5ce66636d71ca5` | Commit 2026-10-08 |
| [Metadata schema source](https://github.com/verona-interfaces/verona-module-metadata/blob/85175cbc51a5d40e77b4e6f2ddab944ac0179dd1/verona-module-metadata.schema.json) | Metadata 3.1; `85175cbc51a5d40e77b4e6f2ddab944ac0179dd1` | Commit 2026-02-09 |
| [Prose source](https://github.com/verona-interfaces/verona-interfaces.github.io/blob/ba0ce2e2e7a92484021df145df9446f2aad603d5/widget-docs/index.qmd) | `ba0ce2e2e7a92484021df145df9446f2aad603d5` | Commit 2026-09-20 |
| [Player testbed](https://github.com/iqb-berlin/verona-player-testbed/tree/1343550c864701daf9ca4a1b064351b37a617d89) | `1343550c864701daf9ca4a1b064351b37a617d89` | Commit 2026-01-28 |
| [Studio Lite](https://github.com/iqb-berlin/studio-lite/tree/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6) | `49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6` | Commit 2026-10-12 |

The live generated Player and Widget schemas were fetched at 2026-10-13 12:41:32 UTC and matched the versions above. Pinned source links make this research reproducible; they do not replace checking the latest docs before later implementation.

Skills used for this research: pstack `how`, `typescript-best-practices` with `principle-type-system-discipline`, `technical-writing`, `unslop`, and the root-cause and artifact-verification principles. No subagents were used.

## 3. Verified protocol contracts

All messages use browser `postMessage`. The operation identifier is carried in the envelope's `type` field, as used by the example modules and both host implementations.

Directions below are relative to Testcenter. The Widget specification defines four operations. Implementing its complete host side means listening for three widget messages and sending the start command. `vowStartCommand` is host-to-widget, not another incoming widget event.

### Player and Testcenter

| Message | Direction | Fields and observations |
| --- | --- | --- |
| `vopWidgetCall` | Player → host | `sessionId: string`; optional `callId: string`; `widgetType: string`; optional `parameters: WidgetParameter[]`; optional `state: string`. |
| `vopWidgetReturn` | Host → player | Required `sessionId: string`; optional `callId: string` and `state: string`. No `widgetType`, timestamp, or sharedParameters is specified on the return. |

The current Player 6.3.0 `widgetType` enum contains:

- `WIDGET_CALC`
- `WIDGET_PERIODIC_TABLE`
- `WIDGET_MOLECULE_EDITOR`
- `UNIT`

A Player `WidgetParameter` requires `key: string`, with at least two characters. Its `value: string` is optional.

The `vopWidgetCall` payload's `required` list says `sessionId` and `type`, although the declared properties include `widgetType` and do not include `type`. Record this inconsistency instead of claiming that the schema requires `widgetType`. The intended dispatch envelope still needs `type: 'vopWidgetCall'`, and executing a widget requires a usable widget type. A later step must resolve how to interpret and validate this contract.

Player 6.3.0 also specifies `vopReadyNotification.metadata` as a serialized JSON string. Testcenter currently treats `metadata` as an object when detecting `specVersion`. See section 5.

### Widget and Testcenter

| Message | Direction | Required payload | Optional payload |
| --- | --- | --- | --- |
| `vowReadyNotification` | Widget → host | `metadata: string`, serialized metadata JSON | None |
| `vowStartCommand` | Host → widget | `sessionId: string` | `parameters: Parameter[]`, `sharedParameters: Parameter[]`, `state: string` |
| `vowStateChangedNotification` | Widget → host | `sessionId: string`, `timeStamp: string` in date-time format | `sharedParameters: Parameter[]`, `state: string` |
| `vowReturnRequested` | Widget → host | `sessionId: string`, `timeStamp: string` in date-time format | `sharedParameters: Parameter[]`, `state: string`, `saveState: boolean` |

Widget `Parameter` requires both `key: string` and `value: string`; `key` has a minimum length of two characters. This differs from Player `WidgetParameter`, whose value is optional. Do not hide that difference by treating the types as identical.

The Widget payload schemas set `additionalProperties: false`. Payload validation must account for the transport envelope separately: the documented payloads omit the `type` dispatch field even though real messages carry it. `callId` is not a field in the Widget start payload. Both reference hosts currently send it.

`saveState` defaults to `true`:

- `true`, or omitted: the host sends the final widget state to the player.
- `false`: the host does not send `vopWidgetReturn`.
- Both cases close the widget.

The schema describes timestamps as allowing the host to ignore states that arrive out of order. Neither reference host implements timestamp ordering in the inspected widget handler. A later step must define equal-timestamp and malformed-timestamp handling rather than accidentally inheriting arrival-order behavior.

`state` is optional and has string format `byte`. The examples use plain strings or serialized data. Keep the value opaque at the host boundary. Do not invent parsing or re-encoding without a specification decision.

An empty state string is a meaningful value. A missing state is different from `state: ''`. State can arrive in a state notification, in the final return request, or both. The calculator sample explicitly sends final state in `vowReturnRequested`.

These facts come from the [Widget 1.0.1 schema](https://github.com/verona-interfaces/widget/blob/cf497922181a126430ac28350d5ce66636d71ca5/widgetapi.yaml) and the [Player 6.3.0 schema](https://github.com/verona-interfaces/player/blob/72cf5931b3eef24cb1f76fcd19a2d1020a3b7ab2/playerapi.yaml).

### Handshake and identities

The expected communication sequence is:

1. Receive a widget call from the player.
2. Resolve the implementation for the requested widget type.
3. Capture the requesting player window, its player session ID, and the optional call ID.
4. Create the modal and widget iframe. Subscribe before loading executable `srcdoc`.
5. The widget sends `vowReadyNotification` with serialized metadata. This message has no session ID.
6. Testcenter generates a widget session ID and sends `vowStartCommand` to that widget iframe with parameters, shared parameters, and the appropriate initial state.
7. Testcenter receives state notifications for that widget session.
8. The widget sends `vowReturnRequested`. Its state/sharedParameters may be the final update.
9. Close the widget. When `saveState` is not false, return state to the original player using that player's session ID and call ID.

Widget and player sessions are different conversations. Do not reuse the player session lookup for widget events. Ready messages need iframe-source checks because they do not carry a session ID. The user requires a handshake even though the prose says that static widgets may not need a start command.

## 4. Differences between authoritative sources and examples

| Topic | Authoritative / current fact | Lower-priority or reference behavior |
| --- | --- | --- |
| Start parameters | Widget 1.0.1 says `parameters`, array of key/value pairs | Prose calls this `widgetConfig`; Studio types/defaults use records |
| Return operation | Widget 1.0.1 says `vowReturnRequested` | Prose diagram says `vowReturnRequest` |
| Widget metadata | Ready notification carries serialized JSON | Testbed interface types it as a metadata object |
| Return state | Final return may carry state and shared parameters | Both overlays ignore those fields |
| Cancel return | `saveState: false` suppresses the player return | Both overlays always continue for a widget return request |
| Extra start fields | Widget start payload does not declare `callId` | Both reference hosts send `callId` to the widget |
| Widget identity | Modern metadata has `type: 'WIDGET'` plus `model` | Testbed resolves by its older `type` value |
| Type names | Player enum uses `WIDGET_...` values | Prose models use `CALC`, `PERIODIC_TABLE`, `MOLECULE_EDITOR`; calculator sample uses `CALCULATOR` |
| Empty state | Empty string must replace previous state | Studio fixes this; testbed still checks truthiness |

The modern metadata schema 3.1 permits `type: 'WIDGET'` and a free-form `model: string`. It does not impose a canonical model enum. Its model examples include `CALC` and `PSE`, which also differ from some prose/example spellings. Metadata `specVersion` uses MAJOR.MINOR, so `1.0` in the samples is not by itself evidence of incompatibility with patch release 1.0.1.

Decision recorded on 2026-10-13 after the logging step: use `MOLECULE_EDITOR` and `PERIODIC_TABLE` as the player widget type names for the current integration. The running player emits these names, and the supplied widgets use the same metadata models. Preserve these names without adding the `WIDGET_` prefix. This is a compatibility decision for the current player, despite the different enum names in Player 6.3.0. Support for prefixed aliases, calculator names, and other models remains undecided.

The prose site displays a deprecation notice. Its modal behavior and model-based selection remain useful under the user's precedence rule. Its old field and operation names do not override Widget 1.0.1.

## 5. Current Testcenter implementation

Paths in this section are relative to the repository root.

### Message ingress and routing

- `frontend/src/app/app.component.ts`, lines 59–67: one global window message listener forwards messages whose `data.type` starts with `vo`.
- `frontend/src/app/shared/services/maindata/maindata.service.ts`, line 68: `postMessage$ = new Subject<MessageEvent>()`.
- `frontend/src/app/test-controller/components/unithost/unithost.component.ts`, lines 62–79: subscribes to that stream, route changes, navigation denials, and config changes.
- `UnithostComponent.handleIncomingMessage`, lines 89–122: handles ready, player state, unit navigation, focus, and runtime errors. There is no widget-call or Widget-interface handling.
- A targeted search found no existing widget implementation under frontend, backend, definitions, or docs.

The global `vo` filter already passes `vopWidgetCall` and `vow...` names. Missing listeners are downstream. A new widget conversation does not need a second competing global message listener.

The ingress currently reads `event.data.type` and calls `startsWith` without validating that the data is an object and the type is a string. This is relevant when designing the external-message boundary.

### Shared target problem

`UnithostComponent.handleIncomingMessage` assigns:

`this.apiService.postMessageTarget = messageEvent.source as Window;`

at line 96, before checking the message type or session. `VeronaAPIService` is a root service and has one mutable target.

The same target is used by:

- the player start command,
- page navigation,
- navigation-denied notifications,
- player config updates.

Consequently, an incoming widget message can overwrite the player target even if the switch eventually ignores the widget message. This is a concrete multi-iframe integration problem, not just a missing switch case. Player and widget conversations need independent targets.

Current player session IDs are unit aliases. The handler warns for a session absent from `tcs.unitAliasMap` but does not stop processing. It also has no player-iframe source check.

Preserve the existing late-state behavior deliberately. `handleStateChangedNotification` maps messages to the originating unit alias, including data received while changing units. Existing end-to-end coverage checks a final state message on iframe unload. Simply dropping every non-current-player message could break that contract.

### Ready notification compatibility

`handleReadyNotification`, line 125, gets the version from:

`msgData.apiVersion || msgData.metadata?.specVersion`

The latest Player ready message specifies serialized metadata, so this path cannot extract the version from a standard string when `apiVersion` is absent. The backend/frontend already report a readable error for a missing version, but that does not make the current serialized-metadata format work.

This is an existing compatibility gap to consider when updating the player message boundary. Keep legacy-player support in scope when choosing how broadly to update it. The package's 2–6 major range already accepts major 6; changing it alone does not add support for the new messages.

### Player rendering and unit navigation

`UnithostComponent.open`, lines 289 onward, removes the old player iframe, sets the current sequence ID, waits for the block resources, and prepares the unit.

`prepareIframe`, lines 384–400, creates the player iframe and assigns HTML to `srcdoc` from `tcs.getPlayer(playerFileName)`.

Player targets and widget return targets must survive asynchronous loads without being silently rebound to another unit. A widget call belongs to the player iframe that requested it.

### Test-run state owner and reset lifecycle

`frontend/src/app/test-controller/services/test-controller.service.ts`:

- Root-provided service.
- `testId`, line 75.
- Unit maps and current-unit state, lines 83 onward.
- Player HTML cache, line 118.
- Shared parameters, line 121.
- `reset()`, lines 316–339, clears player HTML, shared parameters, units, aliases, testlets, timers, booklet, and other run state.
- `addPlayer / hasPlayer / getPlayer`, lines 403–413, manage HTML by resource filename.

`frontend/src/app/test-controller/services/test-loader.service.ts`:

- `loadTest()` calls `reset()` before loading a test.
- Loader `reset()` calls `tcs.reset()`.
- `restoreLastState()` restores shared parameters from persisted `SHARED_PARAMETERS`.
- `getPlayer()` loads HTML through `BackendService.getResource` and caches it in TCS.

`frontend/src/app/test-controller/components/test-controller/test-controller.component.ts`, lines 127–149, sets `tcs.testId` from parent route params and calls `loadTest()`.

`frontend/src/app/test-controller/routing/test-controller-routing.module.ts` defines a parent `:t` controller route with children `status` and `u/:u`. This supports a run-level memory owner that survives ordinary unit changes. A component-local widget state field alone will not meet the cross-unit requirement.

The final scope/reset policy still needs a decision for leaving and returning to the same test URL, reloading/reinitializing the same test, pause/status transitions, and changing test IDs. Do not use database-backed test state as a shortcut for the requested memory-only cache.

### Shared parameters have separate semantics

`TestControllerService.addSharedParameters`, lines 1201 onward, stores changes in the existing test-state buffer as `SHARED_PARAMETERS` and emits config changes. That path persists shared parameters.

Two defects visible in this existing helper:

- It accepts only truthy `param.value`, so empty strings do not update a parameter.
- For an existing key, it assigns `existingParam.value = value` before comparing the same value, so `hasChanged` becomes false for a changed existing parameter.

These are relevant if widget shared-parameter updates use the helper. Widget state and existing shared parameters are distinct concepts. The user excluded widget-state database persistence; do not silently interpret that as either permission to persist widget state through shared parameters or a request to remove existing shared-parameter persistence.

### Timers, forced transitions, focus, and overlays

- Testcontroller receives remote commands and timer events independently of participant interaction.
- Expiry can trigger navigation; commands can force navigation, pause, or termination.
- `startAppFocusLogging()` tracks `UNKNOWN` as focus lost and host/player as focus present.
- A widget overlay must account for focus within its iframe.
- `TestControllerComponent.ngOnDestroy()` unsubscribes its known subscriptions and exits fullscreen, but has no widget cleanup.
- `UnithostComponent.ngOnDestroy()` unsubscribes its subscriptions.
- CDK and Material are already dependencies; `MatDialogModule` is imported in the Testcontroller module.
- The inspected sources did not contain an existing `FullscreenOverlayContainer` override.

Blocking participant interaction with the background is required. Whether timers continue, and what happens to the overlay on forced transitions, must be agreed explicitly. A CDK backdrop alone does not prove that keyboard focus and programmatic navigation are handled correctly.

## 6. Widget files and infrastructure

### Existing resource download path

`frontend/src/app/test-controller/services/backend.service.ts`, `getResource(workspaceId, path)`, selects the configured file server or backend and requests:

`file/<groupToken>/ws_<workspaceId>/<path>`

It returns text with loading progress. Reuse this authenticated resource-delivery path when appropriate; do not infer a widget filename from its requested type.

`TestData.resources` is currently a unit-indexed relationship map. Its relationship union contains:

- `usesPlayerResource`
- `isDefinedBy`
- `usesPlayer`
- `usesScheme`

There is no widget registry or type-to-widget mapping in the TestData interface.

### Backend paths that provide the current information

- `backend/src/controller/TestController.class.php`, `get()`: returns mode, laststate, booklet XML, resource paths, firstStart, workspaceId, and presetBookletStates.
- `backend/src/workspace/Workspace.class.php`, `getBookletResourcePaths()`: structures resources by unit ID and relationship, and registers them in the file cache.
- `backend/src/dao/WorkspaceDAO.class.php`, `getBookletResourcePaths()`: queries resource files through booklet→unit→resource relations.
- `backend/src/data-collection/FileRelationshipType.class.php`: no widget-specific relation.
- `backend/src/files/XMLFileUnit.class.php`: reads player dependencies from Unit XML `Dependencies/File` or legacy `file`, with absent `for` or `for="player"`, and records them as `usesPlayerResource`.

This information lists resource paths, not modern widget models or a resolved widget selection. Testbed's upload picker and Studio's module registry are different infrastructure and cannot be copied unchanged into Testcenter.

### Modern metadata is not recognized by the current resource parser

`backend/src/files/ResourceFile.class.php`, `readVeronaMetadataV4()`, requires the exact old schema URL:

`https://raw.githubusercontent.com/verona-interfaces/metadata/master/verona-module-metadata.json`

All three supplied samples use the newer `verona-module-metadata` repository/schema file. Therefore this modern path is not recognized by the old parser. The code falls back to older formats and filename-based version guessing; it reports warnings rather than necessarily rejecting the upload.

The parser records ID, version, spec version, and type for recognized metadata, but does not read `model`. `FileData` has no dedicated model field. `File.jsonSerialize()` includes Verona type/version information but no model unless future code explicitly puts it into context data.

`FileData` already has flexible `contextData`; research did not decide between using it and adding a dedicated field. Do not assume a database migration is necessary, or unnecessary, before designing the resource metadata contract.

If a DAO/controller response changes, update the appropriate public API documentation. The current test API source is `docs/api/test.spec.yml`.

## 7. Player testbed reference

Inspected snapshot: `1343550c864701daf9ca4a1b064351b37a617d89`.

Source links:

- [Widget service](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/services/widget.service.ts)
- [Unit host](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/components/unit-host/unit-host.component.ts)
- [Overlay component](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/components/widget/widget-overlay.component.ts)
- [Overlay template](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/components/widget/widget-overlay.component.html)
- [Overlay styles](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/components/widget/widget-overlay.component.scss)
- [Session service](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/services/session.service.ts)
- [Host subscription service](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/verona/src/lib/host/verona-subscription.service.ts)
- [Host post service](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/verona/src/lib/host/verona-post.service.ts)
- [Protocol types](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/verona/src/lib/verona.interfaces.ts)
- [Metadata parser](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/models/verona-metadata.class.ts)
- [Widget data model](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/models/app.classes.ts)
- [App template](https://github.com/iqb-berlin/verona-player-testbed/blob/1343550c864701daf9ca4a1b064351b37a617d89/projects/testbed/src/app/app.component.html)

Useful structure:

- `WidgetService` owns a signal-based widget list, an active widget, parameters, call ID, start state, and a widget-running signal.
- Widgets are uploaded HTML files, one entry per old widget type.
- `WidgetData` holds HTML, metadata, and mutable per-widget state.
- `SessionService` has independent player and widget targets/session IDs.
- The app template renders the overlay while `widgetRunning()` is true.
- The unit host handles call, ready, and state events.
- The overlay uses a centered CDK overlay, dark backdrop, a TemplatePortal, and an iframe loaded with `srcdoc`.
- Host `VeronaSubscriptionService` exposes observable streams for the incoming widget events.

Behavior and gaps:

- A call resolves through `setActiveWidget(msgData.widgetType)`, then sets the running signal, parameters, and call ID.
- Call state is assigned only when truthy. A later call can retain an old `ws.state` if the call omits or clears it.
- State notifications write `activeWidget.state` only for truthy state and publish a widget response. The separate `ws.state` used at startup is not updated by this code.
- The latest commit, [state restoration change](https://github.com/iqb-berlin/verona-player-testbed/commit/1343550c864701daf9ca4a1b064351b37a617d89), forwards state from the call into startup. It does not establish a complete cross-call cache policy.
- Invalid player/widget sessions are logged, but processing is not rejected.
- `vowStartCommand` includes the undeclared `callId`.
- The overlay's return subscription calls `continue()`, which calls `close()`, then calls `close()` again. That can send the player return twice.
- The return subscription is not disposed by an `OnDestroy` path in the component.
- The return handler ignores `saveState`, timestamp, final state, and shared parameters.
- The metadata parser uses `data.type` for selection and does not read modern `model`.
- Some interface types are outdated: ready metadata is typed as an object; widget shared parameters as a record; return request omits optional final state/shared parameters.
- The parameters fallback in the call handler is `{}` even though the service field is typed as an array.

The testbed's `TestControllerService` was inspected, but its widget-specific registry/state behavior lives mainly in `WidgetService` and the unit host. Do not assume the shared class name maps directly to Testcenter ownership.

## 8. Studio Lite reference and fixes

Inspected snapshot: `49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6`.

Source links:

- [Preview directive](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/directives/preview.directive.ts)
- [Widget overlay](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/modules/workspace/components/widget-overlay/widget-overlay.component.ts)
- [Overlay template](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/modules/workspace/components/widget-overlay/widget-overlay.component.html)
- [Overlay styles](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/modules/workspace/components/widget-overlay/widget-overlay.component.scss)
- [Overlay tests](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/modules/workspace/components/widget-overlay/widget-overlay.component.spec.ts)
- [Call-data interface](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/modules/workspace/models/widget-call-data.interface.ts)
- [Module service](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/services/module.service.ts)
- [Base Verona module directive](https://github.com/iqb-berlin/studio-lite/blob/49b71b9a09bb6139e1b59b4ab1c8247226c6e6a6/apps/frontend/src/app/directives/verona-module.directive.ts)

Useful improvements:

- The preview handler accepts player events only from its player iframe.
- It lazily loads the widget module list and selects by `metadata.model === data.widgetType`.
- It fetches widget HTML through the module service, then opens a CDK ComponentPortal overlay.
- The overlay gets its own widget iframe and session while capturing the player target/session as inputs.
- Widget messages are filtered by the widget iframe's `contentWindow`.
- The overlay subscribes before the deferred `srcdoc` assignment.
- It unsubscribes through `takeUntil` and `ngOnDestroy`.
- It has a close icon, viewport-based 95vw/95vh sizing, and an iframe activity directive.
- No matching module produces a translated snackbar.

The verified empty-state fix is [commit 18d8952348d65aa0e464bf5eddbcfc4621e58324](https://github.com/iqb-berlin/studio-lite/commit/18d8952348d65aa0e464bf5eddbcfc4621e58324), dated 2026-09-23, referencing `#1685`.

It changes state handling to accept any string, including `''`. A missing or null state keeps the previous value. The tests check deselecting every periodic-table symbol and returning the empty value.

Remaining gaps:

- `WidgetCallData.parameters` and `sharedParameters` are records, not the current Widget arrays.
- Startup defaults are `{}` and include the undeclared `callId`.
- Widget source filtering exists, but message handling does not verify widget session IDs or timestamps.
- `vowReturnRequested` always calls `continue()`; it ignores `saveState` and final state/shared parameters.
- Shared parameters from widget notifications are not handled.
- State lives in the overlay, initialized from call data. The inspected code does not provide a per-test cross-unit cache.
- Selection uses the first matching model; the inspected path does not define duplicate/version-selection policy.
- The inspected overlay creation path does not establish full focus trapping, forced-transition disposal, or a policy for concurrent/repeated calls.
- Studio's iframe activity directive serves its heartbeat system. Testcenter has different activity/focus behavior, so do not copy that directive blindly.

Both repositories have MIT licenses. Preserve required notices when copying substantial source. The Verona API sources declare CC0-1.0.

## 9. Supplied local widget examples

The files were inspected as text without editing or executing them.

| Local file | Embedded ID | Embedded version | Type | Model | Spec / metadata version |
| --- | --- | --- | --- | --- | --- |
| `verona-widget-periodic-table-1.0.0.html` | `periodic-system-select-widget` | 1.0.0 | WIDGET | PERIODIC_TABLE | 1.0 / 3.1 |
| `verona-widget-molecule-editor-1.0.0.html` | `molecule-editor-widget` | 1.0.0 | WIDGET | MOLECULE_EDITOR | 1.0 / 3.1 |
| `iqb-widget-calc-0.1.0.html` | `calculator-widget` | 1.0.0 | WIDGET | CALCULATOR | 1.0 / 3.1 |

The calculator filename's 0.1.0 does not match its embedded 1.0.0 version. Prefer metadata for module identity and record this fixture mismatch.

Periodic-table and molecule-editor metadata point to the schema at commit `85175cbc...`. Calculator metadata points to the current master path in the renamed metadata repository.

Common behavior visible in their bundled scripts:

- Ready notification sends `JSON.stringify(metadata)`.
- They accept `vowStartCommand`.
- Startup uses `state ?? ''`.
- Configuration conversion accepts arrays and legacy records and maps absent values to empty strings. That tolerance belongs to the examples and does not replace the official host contract.
- State notifications include widget session, ISO date-time, and state.
- Return uses `vowReturnRequested` and `saveState`.
- Periodic-table and molecule-editor return requests omit final state and rely on the previous state notifications.
- Calculator return requests include explicit final state. Ignoring final return state can return the wrong calculator value.

SHA-256 hashes, calculated from the inspected UTF-8 text:

- Periodic table: `d214fbd9c67b3909ba7464aaf0e519a575f0f5de19c399e33d5cab5e9f367445`.
- Molecule editor: `44b8fcd78f7e09dd16196e737bb317576ee9cc558ef06a95fccf6444ad7be94a`.
- Calculator: `0a2d8dcde7b25da0a5aa6f72b03f11a563cbe08af20165b9ca4b7d66562cf4b9`.

## 10. Decisions to ask about in later steps

This list records decisions and remaining questions. The accepted modal, lifecycle, state, and protocol-hardening recommendations from 2026-10-14 are recorded in `docs/verona-widget-handoff.md`, under "Accepted decisions for the coming implementation". Those decisions supersede the corresponding open questions below and do not authorize implementing the entire feature.

1. Widget provisioning and selection. The user chose uploaded workspace resources and a dedicated `files.verona_model` column rather than `contextData` on 2026-10-13. On 2026-10-14, the user chose a `widgets` map in the existing test response, keyed by exact model, with lists of resource paths. The temporary selection policy is to take the last entry. Lists use file modification time ascending, then bytewise filename ascending for ties. The user explicitly accepted modification time for now: it is not upload time, and ZIP imports can preserve older timestamps. PIN: this is not the final policy for multiple files per model. Revisit selection before treating it as permanent. No ambiguity dialog or automatic semantic-version selection was chosen.
2. Remaining type-to-model mapping. `MOLECULE_EDITOR` and `PERIODIC_TABLE` are agreed player names and match the supplied widgets' metadata models directly. Support for the Player `WIDGET_...` names, calculator names, and other aliases remains undecided.
3. `UNIT` widget requests. Player 6.3.0 includes this enum value. Decide whether this feature covers unit-as-widget execution or reports unsupported type. It is not implemented by either inspected widget path.
4. Initial state precedence, accepted 2026-10-14. Explicit call state overrides cached state, including an empty string. Omitted state restores cached state.
5. Cache identity. Decide whether memory is keyed by model, resolved module identity, another scope, or a combination. `callId` identifies the requesting player element; it is not specified as the cross-unit cache key.
6. Cancel and memory semantics, accepted 2026-10-14. Cancellation suppresses the player return and keeps received interim state updates in run-level memory. Do not roll them back. Widget state remains memory-only.
7. Run boundaries. Define clearing on different test ID, termination, leaving/reentering a test, reload/reinitialization, and pause/status transitions.
8. Shared parameters. Define integration with existing persistent shared parameters while keeping widget state memory-only. Repair the helper's relevant defects if this path is used.
9. Timestamp policy. Define stale/equal timestamp handling across notifications and final return; define malformed input behavior.
10. Modal implementation, accepted 2026-10-14. Start with Material `MatDialog`, with focus trapping, dialog-container initial focus, restoration to the player iframe, accessible naming, a close button, and no Escape or backdrop dismissal. See the handoff for sizing and remaining presentation questions.
11. Forced transitions, accepted 2026-10-14. Test timers continue. Close and dispose on unit change, pause, termination, logout, or controller destruction, without returning to a departing player. System dialogs take priority. Whether a same-unit competing dialog closes or covers the widget remains open.
12. Repeated calls and failures, accepted 2026-10-14. Open the loading dialog immediately after resolution. Allow one active call including loading and ignore additional calls with a diagnostic. Show failures in the dialog with a close button and use a 15-second ready timeout after loading HTML. Retry controls and detailed late-event/duplicate-message policies remain open.
13. Player protocol update scope. Decide whether to update only widget-related contracts and metadata parsing or also unrelated Player 6.3 configuration additions. No unrelated printing feature was selected during this research.

Ask only the questions needed for the next explicitly requested step. Do not make the user settle the entire implementation at once.

## 11. Verification context for future work

No feature tests, builds, or live browser interactions were run during this research-only task. Claims above are based on inspected code, schemas, HTTP responses, and sample HTML. No production code, tests, schema, or changelog was changed.

Existing test infrastructure:

- Frontend uses Jasmine/Karma. `frontend/package.json` runs `ng test --watch=false`.
- `frontend/src/karma.conf.js` configures `ChromiumHeadlessNoSandbox`.
- Repository command: `make test-frontend-unit`, via Docker Compose.
- `UnithostComponent` currently has only a creation test. Its mocks differ from current constructor/subscription needs; assess setup before adding message behavior tests.
- `TestControllerService` tests use real service behavior with test data builders and controlled backend/message dependencies.
- `e2e/src/e2e/Test-Controller/regression-test-last-unit-state.cy.ts` tests the late player state message emitted on iframe unload. Preserve that regression coverage when changing routing.
- Existing e2e utilities support iframe interaction and player fixture modification.
- Backend metadata tests: `backend/test/unit/files/ResourceFileTest.php`, with old metadata fixtures.
- Backend unit and API commands: `make test-backend-unit` and `make test-backend-api`.
- If public resource/test responses change, update `docs/api/test.spec.yml` and relevant API tests.

Scenarios worth covering once the behavior is agreed:

- Ready/start handshake with standard serialized metadata and array parameters.
- Independent player/widget targets and sessions; page/config commands still reach the player.
- Correct player `callId` and session on return.
- Cross-unit state restoration within one run and no leakage into another run.
- Explicit call-state precedence, empty state, missing state, and final-return-only state.
- Return with `saveState` true, false, and omitted.
- Shared parameters in notifications and final return.
- Out-of-order messages, wrong source/session, late events after disposal, and repeated return.
- No duplicate player return and no subscription/iframe/overlay leaks.
- Modal keyboard/focus behavior and restored focus after close.
- Timer/proctor/navigation lifecycle behavior under the chosen policy.
- Missing widget, duplicate selection, failed download, bad metadata, and failed handshake.
- Real integration with all three sample widgets after any agreed fixture corrections.
- Existing old-player compatibility and the iframe-unload state regression.
- Widget state causes no backend persistence request; existing unrelated response/shared-parameter persistence still behaves according to its separate contract.

## 12. Completed implementation steps

Implementation update on 2026-10-13: `files.verona_model` stores the unchanged metadata model. Schema patch `19.0.0` adds the column and module type `widget`, then invalidates workspace file hashes so initialization re-reads existing uploads. The parser accepts the modern metadata schema URLs used by the uploaded files. File API responses expose a nonempty model as `info.veronaModel`. The running workspace now stores `MOLECULE_EDITOR` and `PERIODIC_TABLE` for its two widgets. Widget discovery, selection, loading, and execution remain future steps.

Migration file: `scripts/database/patches.d/19.0.0.sql`. The same schema changes are included in `scripts/database/full.sql`, and `DBSchema::REQUIRED_VERSION` is `19.0.0`. The migration was applied successfully to the running development database.

Verification: 40 file tests, 5 WorkspaceDAO tests, and 1 schema-version test passed. The backend API suite completed with 292 passing checks, 13 skipped checks, and no failures or errors. The frontend TypeScript check and `git diff --check` passed. A direct database query confirmed the two uploaded widgets' stored models and module type `widget`.

Implementation update on 2026-10-14: `GET /test/{test_id}` includes all valid widget resources with a nonempty model in the authenticated workspace, grouped as `widgets: {model: ['Resource/file.html']}`. No unit-widget relations are created. An empty list of widgets is serialized as `{}`. The backend registers the paths with the existing file cache. The frontend test-response type includes the map, but widget-call selection, HTML loading, and execution remain future steps. Ordering and its temporary selection policy are recorded in decision 1 above.

Implementation update on 2026-10-14, widget-call resolution: `TestLoaderService` stores the response's `widgets` map in `TestControllerService`. The service clears it on test-run reset and resolves an exact model match to the last resource path using the temporary policy from decision 1. `UnithostComponent` logs `vopWidgetCall resolved:` with the selected path and original call. Missing or unusable widget types produce `No uploaded widget found for vopWidgetCall:`. No aliases are added. Widget HTML downloading, the modal, and Widget-interface communication remain future steps.

Implementation update on 2026-10-14, HTML download: after resolving a call, `UnithostComponent` downloads the selected resource through `BackendService.getResource()` using the current workspace and existing group-token authentication. It waits for HTML content rather than logging progress events as success. Success logs `Widget HTML downloaded:` with `resourcePath` and `htmlLength`, the JavaScript string length, not a byte count. Failures log `Widget HTML download failed:` with the path and error. Pending downloads are canceled on unit-host destruction. This step does not cache or execute HTML. The modal, iframe, and Widget-interface handshake remain future steps.

## 13. Suggested use in a new session

A suitable opening instruction is:

> Read docs/verona-widget-context.md and the applicable AGENTS.md files. Treat the document as a research snapshot, not authorization to implement the entire feature. Recheck the latest authoritative Verona documentation for the step being changed. I will request implementation one step at a time. Ask about meaningful alternatives before choosing them.

For the current handoff, also read `docs/verona-widget-handoff.md` before resuming.

Possible iteration boundaries are protocol contracts/message ownership, widget provisioning, run-level state, modal/handshake, return/shared-parameter semantics, and full integration checks/documentation. These are navigation aids for future prompts, not an approved implementation plan.

