- When writing SQL queries (in .php and .sql), use ALLCAPS for SQL keywords
- Base database-related changes only on the table shape in `scripts/database/full.sql`; current database contents are unavailable.
- when modifying the number of rows of any sql table within the sampledata, make sure to adapt calls to 'expect_table_to_have_rows' in all scripts in backend/test/initialization/tests/general
- Migrations: SQL patches go in `scripts/database/patches.d/`. Seeds go in `backend/test/unit/testdata.sql` (INSERT statements only).
- Timestamps: `timestamptz` columns come back as `YYYY-MM-DD HH:MM:SS+00`, with up to six
  fractional-second digits when they are not zero. The offset identifies the instant, so never
  reinterpret such a value in the display timezone. Convert it at the call site: use
  `TimeStamp::fromSQLFormat()` wherever the caller is promised an integer Unix timestamp, and
  `TimeStamp::sqlToDisplayFormat()` wherever it is promised a readable timestamp. Passing the raw
  value through to an API field or an export is only correct if that field is documented as
  carrying the database format.
