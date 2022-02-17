# Manual Local installation 
This is an explanation how to install the backend on a machine directly without using the docker-container. 
That is not recommended but might be of interest in some special development or testing contexts.

#### Prerequisites

* Apache2 (other Webservers possible, but untested) with
    * mod_rewrite extension
    * header extension
* see composer.json for PHP-version and extensions 
* MySQL
* for tests / doc-building: NPM

#### Installation Steps

- Clone this repository:
```
git clone https://github.com/iqb-berlin/testcenter-iqb-php.git
```

- Install dependencies with Composer:
```
sh scripts/install_composer.sh # or install composer manually
php composer.phar install
```

- Make sure, Apache2 accepts `.htacess`-files (`AllowOverride All`-setting in your Vhost-config) and
  required extensions are present. *Make sure, config and data files are not exposed to the outside*.
  If the `.htacess`-files is accepted by Apache2 correctly this would be the case.

- Ensure that PHP has _write_ access to `/tmp` and `/vo_data`:
```
sudo chown -R www-data:www-data ./integration/tmp # normal apache2 config assumed
sudo chown -R www-data:www-data ./vo_data # normal apache2 config assumed
```
- create a MySQL database
- Run the initialize-script, that creates
    - a superuser
    - a workspace with sample data
    - `config/DatabaseConnectionData.json` config file
    - `config/system.json` config file
    - necessary tables in the database
```
sudo --user=www-data php scripts/initialize.php \
    --user_name=<name your future superuser> \
    --user_password=<set up a password for him> \
    --workspace=<name your first workspace> \
    --host=<database host, `localhost` by default> \
    --post=<database port, usually and by default 3306 for mysql and 5432 for postgresl> \
    --dbname=<database name> \
    --user=<mysql-/postgresql-username> \
    --password=<mysql-/postgresql-password> \
    --broadcastServiceUriPush=<address of broadcast service to push for the backend, example: http://localhost:3000> \
    --broadcastServiceUriSubscribe=<address of broadcast service's websocket to subscribe to from frontend, example: ws://localhost:3000>
```

#### Options
- See `scripts/initialize.php` for more options of the initialize-script.

- Optionally you can create the file `config/DatabaseConnectionData.json` beforehand
  manually and omit the corresponding arguments when calling the initialize-script.
  You may use the template file `config/DatabaseConnectionData.template.json` as a starting
  point for your own. If values are not self-explanatory, see the init-script parameter
  descriptions above.
  Check this file if you have any trouble connecting to your database.
  Example:
```
{
  "type": "mysql",
  "host": "localhost",
  "port": "3306",
  "dbname": "my_database",
  "user": "my_user",
  "password": "some_secrets"
}
```

- You may also create config/system.json by hand. Example:
```
{
  "broadcastServiceUriPush": "http://localhost:3000",
  "broadcastServiceUriSubscribe":"ws://localhost:3000"
}
```
If you choose not to use the BroadcastingService, let both variables empty (but don't omit them!).

- Optionally you can create the database structure beforehand manually as well:
```
mysql -u username -p database_name < scripts/sql-schema/mysql.sql
mysql -u username -p database_name < scripts/sql-schema/mysql.patches.d/6.0.0.sql
mysql -u username -p database_name < scripts/sql-schema/mysql.patches.d/6.1.0.sql
mysql -u username -p database_name < scripts/sql-schema/mysql.patches.d/10.0.0.sql
etc.
```


## Running the tests without docker

#### Unit tests

```
vendor/bin/phpunit unit-tests
```

#### E2E/API-Tests

These tests test the in-/output of all endpoints against the API Specification using [Dredd](https://dredd.org).


##### Preparation:
* install Node modules
```
npm --prefix=integration install
```

* If your backend is not running under `http://localhost`, use env `TC_API_URL` variable to set up it's URI
```
export TC_API_URL=http://localhost/testcenter-iqb-php
  &&  npm --prefix=integration run dredd_test
```

##### Run the E2E/API-Tests
```
 npm --prefix=integration run dredd_test
```

##### Run E2E/API-Tests against persistent database
If you want to run the e2e-tests against a MySQL database do the following:
- in `/config` create a file `DBConnectionData.e2etest.json` analogous to `DBConnectionData.json` with your connection
- also in `/config` create a file `e2eTests.json`with the content `{"configFile": "e2etest"}`
- **Be really careful**: Running the tests this way will *erase all your data* from the data dir `vo_data` and the
specified database.

#### Testing the init-script
Testing the init-script without docker is impossible. Use
```
make test-init
```
