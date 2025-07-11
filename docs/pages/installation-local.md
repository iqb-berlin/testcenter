---
layout: default
---

For development, we sometimes want to run the testcenter locally without docker.


# Requirements
Minimal requirements are: npm, node, php, apache2, MySQL.
Have a look into the dockerfiles to get the exact versions.
 
# Installation

## Start
* clone this repo in a subfolder of your Apache, let's say to /var/www/testcenter

## Install node-dependencies
```
npm install

cd frontend
npm install
cd ..

cd backend
npm install
cd ..

cd broadcaster
npm install
cd ..
```

## Install php-dependencies
```
cd backend
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
php composer.phar install
cd..
```

## Create Database
* Create a MySQL Database
* Create a second MySQL Database with the same name, but prefixed with `TEST_`.
* use Configuration from `scripts/database/my.cnf`

## Create Backend Config
Create a file `backend/config/config.ini` with your credentials and settings.
```
[database]
host=...
name=...
password=...
port=...
user=...

[broadcastingService]
external=http://localhost:3000/public/
internal=http://localhost:3000

[password]
salt=t

[system]
hostname=localhost
timezone=Europe/Berlin

[debug]
useInsecurePasswords=no
allowExternalXmlSchema=yes
useStaticTokens=no
useStaticTime=now

[language]
dateFormat=d/m/Y H:i
```
Not that files-service and cache-server are currently not available in local installation.

## Initialize Backend
```
sudo --user=www-data php backend/initialize.php
```

Tipp: If you don't want to use the broadcaster omit the last two lines.

## Serve Backend

* use settings from `backend/config/local.php.ini`

## Disable cors
```
cp backend/config/no-cors.htaccess .htaccess
```

## Prepare Frontend
```
echo "export const environment = { production: false, testcenterUrl: 'http://localhost/testcenter/backend/', fastLoadUrl: 'http://localhost/testcenter/backend/' };" \
 > frontend/src/environments/environment.ts
```

# Run

## Frontend
```
cd frontend
npm run start
```

## Broadcaster
(optional)
```
cd broadcaster
npm run start
```

## File-Service
Can not be run locally. It is not needed because files can be served by the regular backend as well.