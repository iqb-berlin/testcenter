## API tests (Dredd)

* Run with `make test-backend-api`. It runs Dredd against `docs/api/*.spec.yml` - one test per
  documented response status per endpoint, built straight from the spec's example.
* **An undocumented status code is never tested.** Passing tests aren't proof a failure case is
  covered - check it's actually listed under `responses:` first.
* `test/api/hooks.js` sabotages the (normally-valid) example request to produce each status code.
  Adding a new required body field doesn't automatically get exercised right - check
  `changeBody`/`deleteBodyKeys` there. Field *missing* -> 400 needs the key deleted; field *present
  but wrong* -> 403 needs its value corrupted. Confusing the two silently tests the wrong thing.
* `skipAfterFirstFail = true` in `hooks.js` means one failure hides all later ones in that run - flip
  to `false` when debugging more than one suspected break.
