ARG PHP_VERSION=8.2.5

FROM php:${PHP_VERSION} AS backend-composer

# PHP zip extension needs the following packages
RUN apt-get update && apt-get install -y \
  zlib1g-dev \
  libzip-dev \
  unzip

RUN docker-php-ext-install -j$(nproc) pdo_mysql zip

COPY backend/config/local.php.ini /usr/local/etc/php/conf.d/local.ini

COPY backend/composer.json .
COPY backend/composer.lock .

COPY --from=composer:2.5 /usr/bin/composer /usr/bin/composer
RUN composer install

VOLUME /vendor

#===============================

FROM php:${PHP_VERSION}-apache-bullseye AS base

RUN apt-get update && apt-get install -y libzip-dev

RUN docker-php-ext-install -j$(nproc) pdo_mysql zip

RUN a2enmod rewrite
RUN a2enmod headers
RUN a2dissite 000-default
COPY backend/config/vhost.conf /etc/apache2/sites-available
RUN a2ensite vhost
RUN echo "ServerName localhost" >> /etc/apache2/conf-available/servername.conf
COPY backend/config/security.conf /etc/apache2/conf-available
RUN a2enconf servername
RUN a2enconf security

COPY backend/config/local.php.ini /usr/local/etc/php/conf.d/local.ini

COPY --from=backend-composer /vendor /var/www/backend/vendor/
COPY backend/.htaccess /var/www/backend/
COPY backend/autoload.php /var/www/backend/
COPY backend/index.php /var/www/backend/
COPY backend/initialize.php /var/www/backend/
COPY backend/routes.php /var/www/backend/
COPY backend/src /var/www/backend/src
COPY scripts/database /var/www/scripts/database
COPY definitions /var/www/definitions
COPY package.json /var/www/package.json
COPY sampledata /var/www/sampledata

RUN mkdir /var/www/backend/config

RUN chown -R www-data:www-data /var/www

EXPOSE 80

#===============================

FROM base as prod

COPY docker/backend-entrypoint.sh /root/entrypoint.sh

# CI needs this:
RUN chmod +x /root/entrypoint.sh

ENTRYPOINT ["/root/entrypoint.sh"]

#===============================

FROM prod as dev

WORKDIR /var/www/backend

RUN pecl install xdebug && docker-php-ext-enable xdebug

COPY backend/config/docker-php-ext-xdebug.ini /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Add testing code
COPY backend/phpunit.xml .
COPY backend/test test

# some initialization tests need this
# jq - JSON parser for bash
RUN apt-get update && apt-get install -y jq