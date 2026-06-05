# Massive Test Data Generator

`backend/test/massive-test-data.php` creates large testcenter datasets for
performance and migration tests.

The script creates workspaces, imports the sample files, replaces the sample
Testtakers file with generated Testtakers files, stores them, and creates
sessions and tests in the configured database. It changes database and data
directory state. Use a disposable test installation.

## Usage

Run from the repository root after configuring the backend environment:

```bash
php backend/test/massive-test-data.php
```

Options can be passed as `--name=value` or `--name value`:

```bash
php backend/test/massive-test-data.php \
  --workspaces=10 \
  --ttfiles_per_workspace=3 \
  --codes_per_login=30 \
  --start_test_probability=0 \
  --lock_test_probability=0
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `--workspaces` | `2` | Number of workspaces to create. |
| `--ttfiles_per_workspace` | `2` | Generated Testtakers XML files per workspace. |
| `--groups_per_ttfile` | `5` | Groups per generated Testtakers file. |
| `--logins_per_group` | `10` | `run-hot-return` logins per group. |
| `--codes_per_login` | `5` | Codes assigned to every `run-hot-return` login. Each code creates one person session. Set to `0` to create one person session per login without a code. |
| `--code_length` | `3` | Length of each generated code. |
| `--password_length` | `8` | Length of generated login passwords. Set to `0` to omit passwords. |
| `--booklet_per_person` | `BOOKLET.SAMPLE-1,BOOKLET.SAMPLE-2,BOOKLET.SAMPLE-3` | Comma-separated booklet IDs assigned to every login. The sample files imported into each workspace must contain these booklets. |
| `--start_test_probability` | `0.3` | Probability from `0` to `1` that each generated test is started. |
| `--lock_test_probability` | `0.3` | Probability from `0` to `1` that each generated test is locked. |
| `--restart_logins_per_group` | `0` | Additional `run-hot-restart` logins per group. They have no codes. |
| `--session_per_restart_login` | `3` | Sessions created for every `run-hot-restart` login. |
| `--duplicate_login_sessions_per_restart_login` | `0` | Create duplicate login sessions for early restart iterations. Compatibility test option for data affected by the pre-14.4.0 duplicate-session bug. |
| `--duplicate_person_sessions_per_restart_login` | `0` | Create duplicate person sessions for early restart iterations. Compatibility test option for data affected by the pre-14.4.0 duplicate-session bug. |

## Generated Data

The main generated counts are:

```text
groups = workspaces * Testtakers files per workspace * groups per file
return logins = groups * logins per group
restart logins = groups * restart logins per group
person sessions = return logins * max(codes per login, 1)
  + restart logins * sessions per restart login
tests = person sessions * number of configured booklets
```

Every group also receives one `monitor-group` login. Monitor logins do not
receive person sessions or tests.

Generated workspace names start with a random run code printed by the script,
making one run easy to identify.

## Compatibility Options

The two `duplicate_*` options generate data shaped like data affected by a bug
before testcenter `14.4.0`. They are for migration tests. Leave them at `0` for
normal performance datasets.

## Existing Example

`backend/test/initialization/tests/14.10.0/start_with_massive_data.sh` uses the
generator to populate a database before measuring initialization time.
