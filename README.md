# IQB Testcenter Backend

These are the backend applications for the applications
- iqb testcenter
- iqb testcenter-admin

You can find frontends for those applications [here](https://github.com/iqb-berlin/testcenter-iqb-ng) 
and [here](https://github.com/iqb-berlin/testcenter-admin-iqb-ng).


# Installation

## With Docker
You can find Docker files and a complete setup [here](https://github.com/iqb-berlin/iqb-tba-docker-setup) .

## Manual Installation

- clone this repository
```
git clone https://github.com/iqb-berlin/testcenter-iqb-php.git
```
- create mysql or postgresql database
- create database structure
```
mysql -u username -p database_name < scripts/sql-schema/mysql.sql
# or
psql -U username database_name < scripts/sql-schema/postgres.sql
```
- create config/DBConnectionData.json with you database connection data
- install dependencies with composer:
```
sh scripts/install_composer.sh # or install composer manually
php composer.phar install
``` 
- configurate webserver, so that only vo_code and admin directories are served outside. If you use Apache2 you can take
 the shipped `.htaccess` as basis. 
- ensure that PHP has access to /tmp and /vo_data
```
sudo chown -R www-data:www-data ./integration/tmp # normal apache2 config
sudo chown -R www-data:www-data ./vo_data # normal apache2 config
``` 
- Run initialize to create a superuser, and, if you want to a workspace with some sample data and a test-login 
```
sudo --user=www-data php scripts/initialize.php --user_name=super --user_password=user123 --workspace=example_workspace --test_login_name=test --test_login_password=user123
```  

  
### Prerequisites

* Webserver, for Example Apache2 
  * mod_rewrite 
  * header extension
* php > 7.1 
  * pdo_extension
* MySQL or PostgreSQL
* for tests / doc-building: NPM

# Tests

## API tests

Tests the In/Output of all Endpoints againt the API Specification.

```
 npm --prefix=integration run dredd_test

# Dev
## Refactoring workflow
* repeat until no error
  - develop spec
  - `npm run --prefix integration compare_spec_wth_v1`
* commit
* refactor (in v2)
* repeat until no error
  - refactor v2 (of sepc if changes were desired) 
  - `npm run --prefix integration compare_spec_wth_v2`
* `npm run --prefix integration create_docs`
* commit
* next endpoint  
