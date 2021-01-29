# Changelog & Upgrade Information

## [next-minor]
### Endpoints
* You can now insert an optional parameter `/alias/{alias}` in the end to obtain data if unit is defined with
an alias in the booklet. This is an HotFix for https://github.com/iqb-berlin/testcenter-frontend/issues/261.

## 9.0.0
The main content of this update is a complete refactoring of the (XML-)File-classes,
Workspace validation and XML-File-Handling. The main goal was to keep validity and
consistency of the workspaces. The refactoring shall also allow more and deeper validation
checks, update scripts and more in the future. The whole part of the software is now backed
with unit-tests galore.
### Requirements
* **PHP 7.4 is now required**
### Endpoints
* The `[GET] /workspace/{id}/validation` endpoint **was removed completely**.
  Validation takes now place on file upload and on `[GET] /workspace/{id}/files`.
* Return-Values and Status-Codes of `[POST] /workspace/{id}/file`
  and `[GET] /workspace/{id}/files` where changed **significantly** to contain the
  file's validation information as well as some metadata to display in the frontend.
### XML
* XML-files without a reference to a XSD-Schema generate a warning now. Currently, 
  the reference can only be done with the `noNamespaceSchemaLocation`-tag! 
* Player-Metadata as defined in [verona2](https://github.com/verona-interfaces/player/blob/master/api/playermetadata.md)
  is supported now.
### Config
* `config/system.json` contains a new (optional) value: `allowExternalXMLSchema` 
  (boolean, defaults to true) . It defines wether the program is allowed to fetch
  XSD schemas from external URLs.

## 8.0.0
The role `monitor-study` / `workspaceMonitor` was removed completely and all functions and endpoints depending on it.
### XML
* Mode `monitor-study` was removed from the `mode`-attribute
### Endpoints
* The following endpoints where removed
* `[PATCH] /{ws_id}/tests/unlock`
* `[PATCH] /{ws_id}/tests/lock`
* `[GET] /{ws_id}/status`
* `[GET] /{ws_id}/booklets/started`

## 7.4.0
### XML
* A new mode for logins is allowed now: `run-demo`

## 7.0.0
### Endpoints
* Log- and State-Endpoints
  * `[patch] \test\{test_id}\state`
  * `[put] \test\{test_id}\log`
  * `[patch] \test\{test_id}\unit\{unit_name}\state`
  * `[put] \test\{test_id}\unit\{unit_name}\log`  
    were changed:
  * They all take items in the form
  ```
  [
    {
       "key": __my_key__,
       "content": __my_content__,
       "timeStamp": 1234567891
    }
  ]
  ```
  * A state change automatically whites a log now.
* `Timestamp` parameter in various endpoints is now `timeStamp` to resemble the Verona 2 Standard

## 6.1.0
### Database
* You have to apply database structure changes,
  see `scripts/sql-schema/patches.mysql.sql`

## 6.0.0
* Hint: Sample Data/Player is still not supporting Verona 2.0 Interface,
  although compatible frontend version expect them!

## 5.0.3
### Config
* You have to manipulate the contents of `config/system.json`: You need now two parameters
  `broadcastServiceUriPush` and `broadcastServiceUriSubscribe` instead of just `broadcastServiceUri`.

## 4.0.0
Introduced the group-monitor for the frist time.
### XML
#### Testtakers
- `name`-attribute of `<group>`-element is now called `<id>`
- introduced optional attribute `label` for `<group>`-element
- in `<Metadata>`-element, only the optional `<Description>` field remains
#### Booklet
- changed defintion of `<Testlet>`-element to get rid of a warning,
  that `<Unit>` was not allowed in some legal constellations
- `id`-attribute is now mandatory for testlets
- `<Units>`-element can not contain `id` or `label` (since it won't be
  visible anywhere anyway), and first `<Restrictions>` can not contain
  `<CodeToEnter>`, which would not make any sense
- Made `<Restriction>` more readable: generic `parameter`-paremater is
  now renamed to `minutes` in context of `<TimeMax>` and to `code` for
  `<CodeToEnter>`-element.
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory,
  and `<Description>` is optional, the rest does not exist anymore.
#### SysCheck
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory,
  and `<Description>` is optional, the rest does not exist anymore.
#### Unit
- in `<Metadata>`-element, the elements `<ID>` and `<Label>` are mandatory,
  and `<Description>` is optional, the rest does not exist anymore.



