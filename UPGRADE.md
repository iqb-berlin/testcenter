# Upgrade Information
## 5.0.3
#### Config
* You have to manipulate the contents of `config/system.json`: You need now two parameters
  `broadcastServiceUriPush` and `broadcastServiceUriSubscribe` instead of just `broadcastServiceUri`.
## 6.0.0
* Hint: Sample Data/Player is still not supporting Verona 2.0 Interface,
although compatible frontend version expect them!   
## 6.1.0
#### Database
* You have to apply database structure changes, 
see `scripts/sql-schema/patches.mysql.sql`
## 7.0.0
#### Endpoints
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
## 7.4
### XML
* A new mode for logins is allowed now: `run-demo`

## [next]
The main content of this update is a complete refactoring of the (XML-)File-classes,
Workspace validation and XML-File-Handling. The main goal was to keep validity and
consistency of the workspaces. The refactoring shall also allow more and deeper validation
checks, update scripts and more in the future. The whole part of teh software is now backed
with unit-tests galore.
#### Requirements
* **PHP 7.4 is now required**
#### Endpoints
* The `[GET] /workspace/{id}/validation` endpoint **was removed completely**.
  Validation takes now place on file upload and on `[GET] /workspace/{id}/files`.
* Return-Values and Status-Codes of `[POST] /workspace/{id}/file`
  and `[GET] /workspace/{id}/files` where changed **significantly** to contain the
  file's validation information as well as some metadata to display in the frontend.
### XML
* XML-files without a reference to a XSD-Schema generate a warning now.
