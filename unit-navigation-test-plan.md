# Unit Navigation Test Suite Plan

## Problem

Navigation logic is split across multiple sources (goto command, UI nav bar, player messages,
timer) and across the component and service layers. This makes it impossible to test all
navigation paths from a single entry point. The hierarchy of what trumps what
(force > locks > testMode > completeness/timer/leaveLocks) is also untested.

---

## Current State

### Navigation sources (all funnel into `tcs.setUnitNavigationRequest`)

- **goto command** (`test-controller.component.ts:190`): resolves unit alias/index, clears
  afterLeave + code locks, restores timer, then calls `tcs.setUnitNavigationRequest(target, force=true)`.
  The pre-processing logic lives in the component, making it untestable without the full component.
- **UI nav bar** (`unit-nav-bar.component.html:8,20,41,61,73`): calls
  `tcs.setUnitNavigationRequest(target)` directly (no force, no pre-processing)
- **Player messages** (`unithost.component.ts:237`): `handleUnitNavigationRequestedNotification`
  → `tcs.setUnitNavigationRequest(target)`
- **Timer ended** (`test-controller.component.ts:255`): `tcs.setUnitNavigationRequest(NEXT ?? END, true)`
- **pause / resume / terminate** (in service): call `setUnitNavigationRequest` directly

### Navigation gate (`canDeactivateUnit`, `test-controller.service.ts:1041`)

Called by `UnitDeactivateGuard`. Runs the check chain:
completeness → timer → leaveLocks.
Returns `of(true)` immediately when `force=true` or when the current unit's parent testlet is locked.

### Entry check (`UnitActivateGuard`, `unit-activate.guard.ts`)

Redirects locked/missing units to the next accessible alternative.

### Lock hierarchy (highest → lowest priority)

1. `force=true` — bypasses everything, interrupts timer
2. Testlet locks (`show > time > code > afterLeave`) — skip all checks if current parent is locked
3. `forceNaviRestrictions` flag — converts completeness blocks to info-only in demo/review modes
4. Completeness restrictions (`denyNavigationOnIncomplete` + booklet config, OR-combined)
5. Timer leave (`timeMax.leave`: forbidden / allowed / confirm)
6. Leave-locks (`lockAfterLeaving`, triggered on exit)

---

## Phase 1 — Refactor: move goto pre-processing into the service

**Goal:** make all navigation sources testable via the service alone, without the component.

### Change: extract `goto()` pre-processing into `tcs.executeGotoCommand(params)`

Extract the pre-processing block from `goto()` (component lines 190-214) into a new public
method on `TestControllerService`:

```typescript
executeGotoCommand(params: string[]): Promise<boolean>
```

This method:
- Resolves alias (`params = ['id', alias]`) via `unitAliasMap`, or uses raw sequenceId (`params = ['n']`)
- If target unit exists: clears `afterLeave` lock on its testlet, clears code lock,
  cancels the current timer and restores time if crossing timer-block boundaries
- Calls `this.setUnitNavigationRequest(gotoTarget, true)`
- Returns `Promise.reject()` for invalid/zero targets

The component's `goto()` becomes a one-liner: `return this.tcs.executeGotoCommand(params);`

### Files changed in Phase 1

- `frontend/src/app/test-controller/services/test-controller.service.ts` — add `executeGotoCommand`
- `frontend/src/app/test-controller/components/test-controller/test-controller.component.ts`
  — `goto()` delegates to `tcs.executeGotoCommand`

---

## Phase 2 — Test suite: `setUnitNavigationRequest`, `canDeactivateUnit`, `UnitActivateGuard`, `executeGotoCommand`

**Goal:** comprehensive coverage of the full navigation pipeline from a single spec file.

### New file: `frontend/src/app/test-controller/services/unit-navigation.spec.ts`

### Test infrastructure

Reuses existing `getTestData()` / `getTestBookletConfig()` fixtures and the
`MockBackendService` / `MockMainDataService` pattern from `test-controller.service.spec.ts`.

Additional setup needed:
- **Router spy** — wrap `RouterTestingModule`, spy on `router.navigate` to capture route targets
  and return `Promise.resolve(true)`, spy on `getCurrentNavigation` to control the `force` flag
- **Dialog spy** — mock `MatDialog.open` to return `{ afterClosed: () => of(result) }`,
  configurable per-test for confirm/cancel outcomes

### Test data extensions

Add a `getNavigationTestData()` helper (or extend `getTestData()`) providing:
- A unit with `PRESENTATION_PROGRESS = 'complete'` and one without
- A unit with `RESPONSE_PROGRESS = 'complete'` and one without
- A testlet with `lockAfterLeaving` in both scopes (`testlet` / `unit`) and both confirm values
- A testlet with `timeMax.leave = 'forbidden'` / `'allowed'` / `'confirm'`
- Two testlets with different `timerId` values for cross-timer-boundary scenarios

### Test group 1 — `setUnitNavigationRequest` routing

- `NEXT` / `PREVIOUS` / `FIRST` / `LAST`: verifies correct sequenceId passed to `router.navigate`
- `END`: triggers `terminateTest`, navigates to `/r/starter`
- `PAUSE` / `ERROR`: navigates to `/t/{id}/status` with `skipLocationChange`
- Specific sequenceId: navigates to `/t/{id}/u/{n}`
- Same sequenceId as current: adds `reload` query param so the unit re-initialises

### Test group 2 — `canDeactivateUnit` (the full hierarchy)

Each test calls `lastValueFrom(tcs.canDeactivateUnit(nextUrl))` and configures state beforehand.

**Level 1 — force**
- `force=true` (via `getCurrentNavigation` stub): returns `true`, calls `interruptTimer`

**Level 2 — testlet locks**
- Current unit's parent testlet is locked: returns `true` without running any checks

**Level 3 — completeness (`forceNaviRestrictions`)**
- `forceNaviRestrictions=false` + presentation incomplete + forward: returns `true`, shows info (no block)
- `forceNaviRestrictions=true` + presentation incomplete + forward: opens dialog, returns `false`
- `forceNaviRestrictions=true` + response incomplete + `denyNavigationOnIncomplete.response = 'ALWAYS'`:
  blocks backward navigation too
- Unit fully presented and responded: returns `true` without dialog

**Level 4 — timer leave (`forceTimeRestrictions`)**
- `leave='forbidden'` + `forceTimeRestrictions=true`: shows message, returns `false`
- `leave='forbidden'` + `forceTimeRestrictions=false`: interrupts timer, shows info, returns `true`
- `leave='allowed'`: cancels timer, returns `true`
- `leave='confirm'` + user stays (dialog returns `true`): returns `false`
- `leave='confirm'` + user proceeds (dialog returns `false`): cancels timer, returns `true`
- Navigating within the same timed block: timer check is skipped entirely

**Level 5 — leave locks**
- `lockAfterLeaving.scope='testlet'`, no confirm: activates testlet lock, returns `true`
- `lockAfterLeaving.scope='unit'`, no confirm: activates unit lock, returns `true`
- `lockAfterLeaving.confirm=true` + user stays: returns `false`, lock not activated
- `lockAfterLeaving.confirm=true` + user proceeds: activates lock, returns `true`
- Navigating within the same testlet (scope=`'testlet'`): skips lock activation

**Interactions**
- Completeness blocks first even when the timer check would also block (chain short-circuits)
- All checks pass: returns `true`

### Test group 3 — `UnitActivateGuard`

Instantiate the guard with a `TestControllerService` stub.

- No booklet loaded (F5 case): redirects to `/t/{id}`
- Target unit accessible: returns `true`
- Target unit locked (not first in a code-locked testlet): redirects to next accessible unit
- Target unit does not exist: shows message, falls back to previous or stays

### Test group 4 — `executeGotoCommand`

- `params=['3']`: resolves to sequenceId 3, calls `setUnitNavigationRequest('3', true)`
- `params=['id', 'u3']`: resolves via `unitAliasMap`, same result
- `params=['0']` or `params=[]`: returns `Promise.reject()`
- Target in a different timer block: cancels current timer, calls `restoreTime` on target testlet
- Target in the same timer block: timer is not cancelled
- Target testlet has `afterLeave` lock: cleared before navigation
- Target testlet has code lock: cleared before navigation

### Files changed in Phase 2

- `frontend/src/app/test-controller/services/unit-navigation.spec.ts` — new file (test suite)
- `frontend/src/app/test-controller/test/test-data.ts` — extend with navigation test fixtures

---

## Phase 3 — Low-level `checkAndSolve*` tests

**Goal:** surgical unit tests for each private check method in isolation, independent of the
full `canDeactivateUnit` chain.

After Phase 2 is green, add tests that call the three private methods directly via
`(tcs as any).checkAndSolveCompleteness(currentUnit, newUnit)` etc.

Each method is tested for:
- Its `Observable<boolean>` return value
- Side effects: which dialog is opened, which message service call is made,
  which lock/state mutation happens

### Scope

- `checkAndSolveCompleteness` — all directions × restriction values × `forceNaviRestrictions`
- `checkAndSolveTimer` — all `leave` values × `forceTimeRestrictions` × same-block skip
- `checkAndSolveLeaveLocks` — both scopes × confirm flag × same-testlet skip

### Files changed in Phase 3

- `frontend/src/app/test-controller/services/unit-navigation.spec.ts` — additional `describe` blocks
