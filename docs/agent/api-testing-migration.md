## Replacing Dredd in the API test suite

`dredd@14.1.0` was last published 2023-02-13 and is unmaintained. It drags in 38 vulnerable
transitive dependencies (10 critical) via `dredd-transactions`, `gavel`, `request`, `optimist` and
friends. They are all dev-dependencies — `npm audit --omit=dev` is clean — so this is CI and
supply-chain hygiene, not a runtime exposure. There is no deadline pressure, but there is also no
upstream fix coming.

**Chosen replacement: Jest, in the existing Node task-runner, with a spec-driven generator plus
hand-written tests for the awkward cases.** No new language, no new Docker image, no new Compose
services.

### Decisions and why

**The OpenAPI specs stay the source of truth.** Today, documenting a new response in
`docs/api/*.spec.yml` automatically gets it tested. That property is the main thing the current
suite buys us, and `backend/CLAUDE.md` already requires specs to be updated when a controller's
output changes. We keep it.

**Node, not Python or PHP.** The tests are blackbox HTTP calls against a running container — they
never load backend code — so the suite's language is free. Node wins on infrastructure that already
exists: `test/api/` is mounted into the `task-runner` image, both Compose services exist, both Make
targets point there. Jest 30 is already used in `broadcaster`. Node 24 in the task-runner image has
native `fetch`, `FormData` and `Blob`, which lets the `multi-part` and `stream-to-string`
dependencies be deleted rather than replaced.

**Hybrid test construction.** A generator walks the merged spec and emits one test per documented
`(endpoint, status code, example)`; roughly 20 special cases are written by hand as ordinary Jest
tests. The generator preserves today's automatic coverage; the hand-written tests cover what was
ugliest in `hooks.js` precisely because Dredd forced it through hook-name matching (uploads, exact
body comparisons against `sampledata/`, CSV byte-order marks).

**Requests stay atomic.** In `TestMode: api` the backend opens a transaction per request and rolls
it back on shutdown (`backend/src/helper/TestEnvironment.class.php:52-66`), which is why static
tokens exist and why a hardcoded token table is possible at all. Multi-request flows (login → use →
expire) are covered by the Cypress e2e suite in `TestMode: integration`. Considered and rejected:
resetting the DB per test so the suite could log in for real. That would delete the token table but
cost test isolation, ordering freedom and parallelism, for flows another suite already covers.

### Considered and rejected

* **Schemathesis** (Python, schema-driven property-based testing). Its headline benefit — validating
  responses against the documented schema — reaches 40 of our 393 documented responses; 337 have no
  `content:` block at all. Its generated-request testing is blocked by auth: every request needs an
  `AuthToken`, and the session endpoints verify an Altcha proof-of-work against
  `SystemConfig::$server_key` (`SessionController.class.php:36-39`), so generated bodies can only
  ever produce 400. Meanwhile ~294 tests would still have been hand-written pytest. Not worth a
  second test-tooling runtime, a new Docker image, two new Compose services and a Python dependency
  convention this repo doesn't have. Can be revisited later as an *additional*, optional CLI job
  once response schemas are more widely documented — it does not need to be part of this migration.
* **PHP / PHPUnit.** Tests would live next to the code they exercise, and
  `league/openapi-psr7-validator` is actively maintained. But it needs a new HTTP client dependency,
  a second PHPUnit configuration, and a home for the file-server suite, which tests a different
  service entirely. The one advantage doesn't outweigh the infrastructure already in place for Node.
* **Karate (Java) and Postman/Newman-based tools (incl. Portman).** Another runtime, or a
  GUI-oriented format that fits poorly with specs as source of truth.

### Target layout

```
test/api/
  jest.config.js        # two Jest projects: backend + file-server
  spec.js               # load + merge docs/api/*.spec.yml -> one document
  generate.js           # walk the spec, emit one test per (endpoint, status, example)
  tokens.js             # the token table, as data
  fixtures.js           # readiness/prepare call, Redis group token, sampledata helpers
  generated.test.js     # the generator, driven by the spec
  uploads.test.js       # multipart cases
  bodies.test.js        # exact-body comparisons (HTML, XML, CSV+BOM)
```

`test/api/test.js` and `test/api/hooks.js` are deleted. Make targets keep their names —
`test-backend-api`, `test-file-server-api` — and only their command changes, from a gulp task to
`npx jest --config test/api/jest.config.js --selectProjects <backend|file-server>`. Gulp itself
stays: it still drives `backend:update-specs`, `create-docs`, `create-interfaces` and `new-version`.

### The merged spec

The 12 spec files are 12 separate OpenAPI documents with `paths` split among them, so a merge is
required regardless of how `$ref`s resolve. `scripts/update-specs.js` already produces exactly that
— merged, with `./components.spec.yml#/...` references localized — for the docs build. The test
suite consumes the same artifact instead of building its own. `prepareSpecsForDredd` and its
`makeDreddCompatible` transform table are deleted outright: every entry in it exists only to work
around Dredd's parser.

### What the generator does

For each documented response, build the request from the spec's example, adjust it for the status
code being tested, send it, assert the status:

| status under test | adjustment |
|---|---|
| 200 / 201 / 205 / 207 / 413 | valid token for the session type the endpoint wants |
| 400 | valid token, but corrupt `password` / `code` / `signature` in the body |
| 401 | no `AuthToken` header at all (see "bugs fixed" below) |
| 403 | `__invalid_token__` |
| 404 | valid token, plus URL rewritten to a non-existent id (`/workspace/1` → `/workspace/13`) |
| 410 | expired token (`static:admin:expired_user`, `static:login:test-expired`, …) |

The session type comes from the one-letter prefix in the spec's `AuthToken` example (`a` admin,
`l` login, `p` person, `g`/`m` group monitor, `s` study monitor). The table itself ports over from
`hooks.js:88-155` unchanged in content — only its shape changes, from a `switch` inside a Dredd hook
to a plain object keyed by status code.

Where a response documents several examples, all of them are tested. Today only the first is, plus a
spec-splitting workaround for the rest. Affected: `GET /session` (3), `GET /test/{id}/unit/{name}`
(2), `GET /workspace/{ws_id}/report/review` (2 × 2 content types).

### Must survive the rewrite

Easy to drop by accident, expensive to debug afterwards:

1. **The warm-up call builds the fixtures.** `confirmTestConfig` is not just a readiness poll: it
   sends `TestMode: prepare`, which triggers `buildTestDB()` and `createTestData()`
   (`TestEnvironment.class.php:43-50`). Ported as a plain health check, every test runs against an
   empty database.
2. **`TestMode: api` on every request** (`backend/index.php:52`) — selects the test database, static
   tokens, fixed clock, and the per-request rollback.
3. **The `Accept` header**, derived from the response content type under test.
4. **The Redis group token** for the file-server suite
   (`group-token:static:group:sample_group`). Currently written once with a 60-second TTL; becomes a
   fixture that refreshes, so a slow or interrupted run can't expire it mid-suite.
5. **Undocumented status codes are still never tested.** That caveat from
   `docs/agent/api-testing-dredd.md` survives the migration and belongs in its replacement doc.

### Bugs fixed on the way

* **Query-string collision.** `hooks.js:85` appends `?XDEBUG_SESSION_START=IDEA` unconditionally.
  Seven endpoints already carry query parameters with examples, so they are currently requested as
  `…?dataIds[]=review_group?XDEBUG_SESSION_START=IDEA` — the parameter value silently absorbs the
  debug flag. Affects the log/response/review/sys-check report endpoints and both attachment-page
  endpoints. The debug parameter becomes opt-in via an environment variable.
* **The 401 case sends the literal string `undefined`.** `changeAuthToken(transaction, {})` looks up
  a key that isn't there, so the header is set to `undefined` rather than removed. It happens to
  produce a 401, but it tests the wrong thing. Both "no header" and "empty header" are worth testing.
* **`tmp/report.html` is discarded.** `tmp/` is not mounted in
  `test/docker-compose.api-test.yml`, so the reporter writes into the container and the file dies
  with `--rm`. Either mount it or drop the reporter; the API tests do not currently run in
  `.gitlab-ci.yml` at all, so nothing consumes it today.
* **Content-Type comparison** stops being a string fixup for nginx-vs-apache spelling
  (`hooks.js:171-180`) and becomes a structural comparison of media type plus charset.
* **One failure no longer hides the rest.** `skipAfterFirstFail` becomes Jest's own `--bail`,
  off by default.

### Sequencing

1. Scaffolding: Jest config, spec loading via `scripts/update-specs.js`, the prepare/readiness
   fixture, the token table. Prove it end-to-end on `session.spec.yml` + `user.spec.yml`.
2. The generator over the remaining backend specs, resource by resource, comparing counts against a
   Dredd run each step so nothing silently disappears.
3. The hand-written cases: uploads, exact-body comparisons, CSV BOM.
4. `file.spec.yml` and the file-server project, including the Redis fixture.
5. Delete `test/api/test.js`, `test/api/hooks.js`, and the `dredd`, `multi-part`,
   `stream-to-string` dependencies. Replace `docs/agent/api-testing-dredd.md`. Remove the remaining
   dredd mentions in `scripts/helper/json-transformer.js`, `docs/api/test.spec.yml`,
   `docs/api/workspace.spec.yml`, `backend/test/initialization/docker-compose.initialization-test.yml`
   and the `prepareSpecsForDredd`-related parts of `scripts/update-specs.js`.
6. `docs/CHANGELOG.md` entry under "Technisches": dependencies removed, API test runner changed.

Parity is checked locally by running both suites and diffing the tested `(endpoint, status)` set —
not in CI, because the API tests don't run there today.

### Follow-ups, deliberately not bundled

* **Per-request fixture cost.** Every API request rebuilds the virtual filesystem and re-imports the
  sample files (`TestEnvironment.class.php:52-60`). That is likely the dominant cost of the suite and
  will matter more once tests can run in parallel — which the per-request rollback makes safe. Worth
  measuring (one timed request) before deciding whether to change anything. Backend infrastructure,
  independent of the test framework.
* **The file-server suite writes into `sampledata/`** (see the TODO on `test-file-server-api` in
  `scripts/make/dev-test.mk`), and its Make target tears down the whole stack and deletes the image
  afterwards. Both should go once the suite is stable.
* **Spec hygiene.** `500` is documented on 87 of 89 operations and tested on none; 204, 406, 409 and
  423 are documented but fall outside the tested set. Decide per code: make it testable, or drop it
  from the spec. Adding response schemas to more of the 353 responses that lack them is what would
  make schema validation (via `ajv`, or later Schemathesis) actually pay off.
