# Upgrade Information
### 5.0.3
* You have to manipulate the contents of `config/system.json`: You need now two parameters
  `broadcastServiceUriPush` and `broadcastServiceUriSubscribe` instead of just `broadcastServiceUri`.
### 6.0.0
* Hint: Sample Data/Player is still not supporting Verona 2.0 Interface,
although compatible frontend version expect them!   
### 6.1.0
* You have to apply database structure changes, 
see `scripts/sql-schema/patches.mysql.sql`
