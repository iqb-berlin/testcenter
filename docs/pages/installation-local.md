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

cd broadcasting-service
npm install
cd ..
```

## Install php-dependencies
```
cd backend
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php -r "if (hash_file('sha384', 'composer-setup.php') === '906a84df04cea2aa72f40b5f787e49f22d4c2f19492ac310e8cba5b96ac8b64115ac402c8cd292b8a03482574915d1a8') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
php composer-setup.php
php -r "unlink('composer-setup.php');"
php composer.phar install
cd..
```

## Create Database
* Create a MySQL Database
* Create a second MySQL Database with the same name, but prefixed with `TEST_`.
* use Configuration from `scripts/database/my.cnf`

## Initialize Backend
```
sudo --user=www-data php backend/initialize.php \
 --user_name=(super user name) \
 --user_password=(super user password) \
 --workspace=(workspace name) \
 --host=(mostly `localhost`) \
 --post=(usually 3306) \
 --dbname=(database name) \
 --user=(mysql-username) \
 --password=(mysql-password) \
 --salt=(an arbitrary string, optional) \
 --broadcastServiceUriPush=(http://localhost:3000 - address of broadcast service to push for the backend, ) \
 --broadcastServiceUriSubscribe=(ws://localhost:3000/ws/ - address of broadcast service to subscribe to from frontend)
```

Tipp: If you don't want to use the broadcasting-service omit the last two lines.

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

## Broadcasting-Service
(optional)
```
cd broadcasting-service
npm run start
```

## File-Service
Can not be run locally. It is not needed because fastLoadUrl goes to the regular backend.