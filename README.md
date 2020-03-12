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

Tests the In/Output of all Endpoints against the API Specification.

```
 npm --prefix=integration run dredd_test

```

If your backend is not installed under http://localhost, use env TC_API_URL variable to set up loacation

```
export TC_API_URL=http://localhost/testcenter-iqb-php 
  &&  npm --prefix=integration run dredd_test
```


## Unit tests

```
vendor/bin/phpunit test
```

# Dev
## Coding Standards

Following [PSR-12](https://www.php-fig.org/psr/psr-12/)

Exceptions:
* private and protected class methods are prefixed with underscore to make it more visible that they are helper methods.  

Most important:
* Class names MUST be declared in StudlyCaps ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Method names MUST be declared in camelCase ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Class constants MUST be declared in all upper case with underscore separators. ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files MUST use only UTF-8 without BOM for PHP code. ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files SHOULD either declare symbols (classes, functions, constants, etc.) or cause side-effects (e.g. generate output, change .ini settings, etc.) but SHOULD NOT do both. ([PSR-1](https://www.php-fig.org/psr/psr-1/))

