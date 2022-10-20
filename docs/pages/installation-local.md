---
layout: default
---

# Requirements
* npm 8
* node 14
* php 8.1
* Apache2

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
php -r "if (hash_file('sha384', 'composer-setup.php') === '906a84df04cea2aa72f40b5f787e49f22d4c2f19492ac310e8cba5b96ac8b64115ac402c8cd292b8a03482574915d1a8') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
php composer-setup.php
php -r "unlink('composer-setup.php');"
php composer.phar install
cd..
```

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

# Serve backend


