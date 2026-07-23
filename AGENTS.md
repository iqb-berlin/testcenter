- read PR-policy.md
- focus on achieving the current taks at hand with minimal code. never refactor existing code, if not explicitly being asked to.
- When writing SQL queries (in .php and .sql), use ALLCAPS for SQL keywords
- Base database-related changes only on the table shape in `scripts/database/full.sql`; current database contents are unavailable.

- **Use declarative colors and font sizes instead of hex codes**: Do not copy hex code colors. Prefer using declarative colors and declarative font sizes when possible.


- Prefer single quotes over double quotes


## Domain-Specific Terminology

* **Workspace** - One Instance of the testcenter application can have multiple workspaces, each with their own user access rights.
* **User** - Each User is one administrator of some kind.
* **Login** - One Login is one person that actually logs in to take the examination.
* **File** - One file is either following the validation rules for vo_Booklet.xsd, vo_SysCheck.xsd, vo_Testtakers.xsd, vo_Unit.xsd or unvalidated Resource.
* **Booklet** - The highest level of how a test is structured into which units.
* **Unit** - Has the actual task and how this task is rendered with which player.
* **Syscheck** - Describes analogous to Booklets, which units are to be loaded for a syscheck. A syscheck tries to show example units for users to find out if the testcenter instance works.
* **Resource** - A not defined File that can be loaded into a test.
* **Attachment** - A deprecated module. Used to describe user uploaded files via direct upload as response object.
* **Test** - The actual test run. Shows the order of units, described in the Booklet.
* **Verona-Player** - The html and javascript code that is injected as iframe into the testcenter and visually displays the content of the test.
* **Testtaker** - The File that defines all logins.
* **Test Command** - A Navigation command that can be send from a users to a login.
* **Log** - Set of Data on the unit and test level.
* **Unit Data** - Set of Data that specifically handles the responses given by logins in their respective tests.
* **Review** - users can give reviews to uploaded tests.
