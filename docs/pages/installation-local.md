---
layout: default
---

# Requirements
* npm 8
* node 14
* php 8.1
* Apache2
* MySQL 8

# Install node-dependencies
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

# Install php-dependencies
```
cd backend
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
php composer.phar install
cd..
```

# Create Database
* Create a MySQL Database
* Create a second MySQL Database with the same name, but prefixed with `TEST_`.
* use Configuration from `scripts/database/my.cnf`

# Initialize Backend
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
 --broadcastServiceUriPush=(address of broadcast service to push for the backend) \
 --broadcastServiceUriSubscribe=(address of broadcast service to subscribe to from frontend)
```

# Serve Backend

* use settings from `backend/config/local.php.ini`

## Disable cors
```
echo "Header add Access-Control-Allow-Origin \"*\"" > .htaccess
echo "Header add Access-Control-Allow-Headers \"origin, x-requested-with, content-type, content-length, responseType, options, observe, Access-Control-Allow-Headers, Authorization, X-Requested-With, Accept, authtoken\" > .htaccess
echo "Header add Access-Control-Allow-Methods \"PUT, GET, POST, DELETE, PATCH, OPTIONS\" > .htaccess
```

# Run Frontend
```
cd frontend
npm run start
```