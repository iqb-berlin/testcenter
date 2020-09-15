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
       "timestamp": 1234567891
    }
  ]
  ```
  * A state change automatically whites a log now.
