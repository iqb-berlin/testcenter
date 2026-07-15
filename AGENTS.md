- focus on achieving the current taks at hand with minimal code. never refactor existing code, if not explicitly being asked to.
- when touching any JSON file in the 'definitions' folder, regenerate the associated docs with 'make update-docs' and 'make create-interfaces'
- when creating a new table in scripts/patches.d, add the table in the backend/src/dao/DAO.class.php tables array. the order within the array is important, as tables that ere foreign keys in other tables need to appear first
- Before opening a PR, always add an entry to CHANGELOG.md
- when creating a .sql file in scripts/patches.d, always make sure that the backend/test/unit/testdata.sql is also filled with the new fields. testdata.sql is purely INSERTs, not CREATE TABLEs. So the rule only applies if there's data worth seeding.
- you dont have access to the current data within the database. make changes on database related issues only according to the shape of the tables alone from @scripts/database/full.sql
- When writing SQL queries (in .php and .sql), use ALLCAPS for SQL keywords

- **Use declarative colors and font sizes instead of hex codes**: Do not copy hex code colors. Prefer using declarative colors and declarative font sizes when possible.
- **Concise responses**: In all interactions, plans, and commit messages, be extremely concise and sacrifice grammar for the sake of concision.
- **Look up library documentation**: If you're ever unsure how a library works, use the Context7 MCP server to research it rather than crawling around node modules or other build files.


- Use `rg` instead of `grep` for searching
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
