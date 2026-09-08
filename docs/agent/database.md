- When writing SQL queries (in .php and .sql), use ALLCAPS for SQL keywords
- Base database-related changes only on the table shape in `scripts/database/full.sql`; current database contents are unavailable.
- `full.sql` is hand-maintained, not dumped from a running database. Its `MIGRATIONSHINWEISE` section records the
  conversion decisions of the PostgreSQL migration (enums, booleans, collations, identity sequences,
  `REPLACE INTO`); read it before you change the schema. When you add a patch to `patches.d/`, apply the same change to
  `full.sql` as well and raise the version that `full.sql` writes into `meta.dbSchemaVersion` to that patch's
  version. A fresh installation runs `full.sql` and then every patch newer than that stamp, and the test database
  runs `full.sql` alone - so if the two drift apart, either a patch is applied a second time or the tests run
  against a different schema than production.
- when modifying the number of rows of any sql table within the sampledata, make sure to adapt calls to 'expect_table_to_have_rows' in all scripts in backend/test/initialization/tests/general
- Migrations: SQL patches go in `scripts/database/patches.d/`. Seeds go in `backend/test/unit/testdata.sql` (INSERT statements only).
- Collation: columns marked `COLLATE german2_ci` use a non-deterministic ICU collation, which gives them the
  case-insensitive comparison they had in MySQL. PostgreSQL refuses `LIKE`, `ILIKE`, `~` and every other pattern
  match on such a column ("nondeterministic collations are not supported for LIKE"). No query does this today.
  Where one has to, either compare with `COLLATE "C"` in the query itself or make the column deterministic and
  put a functional index on `lower(...)`.
- Timestamps: `timestamptz` columns come back as `YYYY-MM-DD HH:MM:SS+00`, with up to six
  fractional-second digits when they are not zero. The offset identifies the instant, so never
  reinterpret such a value in the display timezone. Convert it at the call site: use
  `TimeStamp::fromSQLFormat()` wherever the caller is promised an integer Unix timestamp, and
  `TimeStamp::sqlToDisplayFormat()` wherever it is promised a readable timestamp. Passing the raw
  value through to an API field or an export is only correct if that field is documented as
  carrying the database format.
