# IQB Testcenter Backend

These are the backend applications for the applications
- iqb testcenter
- iqb testcenter-admin

You can find frontends for those applications [here](https://github.com/iqb-berlin/testcenter-iqb-ng) 
and [here](https://github.com/iqb-berlin/testcenter-admin-iqb-ng).


# Docker
You can find Docker files and a complete setup [here](https://github.com/iqb-berlin/iqb-tba-docker-setup) .

# Local Installation

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
- configure webserver, so that only vo_code and admin directories are served outside. if you use apache2 you can take
 the shipped `.htaccess` as basis. 
- Run initialize to create a superuser, and, if you want to a workspace with some sample data and a test-login 
```
sudo --user=www-data php scripts/initialize.php --user_name=super --user_password=user_password --workspace=workspace --test_login_name=a --test_login_password=another_pw
```  
  
## Prerequisites 

* web server, for Example apache2 (with mod_rewrite and header extension)
* php > 7.0 (with pdo_extension)
* mysql or postgresql
