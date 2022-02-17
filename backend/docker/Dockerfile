ARG PHP_VERSION=7.4.22

FROM php:${PHP_VERSION} AS backend-composer

RUN apt-get update && apt-get install -y \
  zlib1g-dev \
  libzip-dev \
  unzip \
  git

# install php extensions
RUN docker-php-ext-install -j$(nproc) pdo_mysql zip

# set up php
COPY docker/scripts/local.php.ini /usr/local/etc/php/conf.d/local.ini

COPY composer.json .
COPY composer.lock .

# install composer dependencies
# https://hub.docker.com/_/composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install

VOLUME /vendor

#========================
FROM php:${PHP_VERSION}-apache-bullseye AS base

LABEL maintainer="IQB Berlin"
LABEL version="1.0"
LABEL description="The PHP backend of the test center. This container ist for DEVELOPMENT only, not for deployment since security guidelines are somehow weak."
LABEL license="MIT"

RUN apt-get update && apt-get install -y \
  libzip-dev

# install php extensions
RUN docker-php-ext-install -j$(nproc) pdo_mysql zip

# set up apache
RUN a2enmod rewrite
RUN a2enmod headers
RUN a2dissite 000-default
COPY docker/scripts/vhost.conf /etc/apache2/sites-available
RUN a2ensite vhost
RUN echo "ServerName localhost" >> /etc/apache2/conf-available/servername.conf \
&& a2enconf servername

# set up php
COPY docker/scripts/local.php.ini /usr/local/etc/php/conf.d/local.ini

# copy source code
COPY .github /var/www/html/.github
COPY classes /var/www/html/classes
COPY definitions /var/www/html/definitions
COPY docs /var/www/html/docs
COPY routes /var/www/html/routes
COPY scripts /var/www/html/scripts
COPY --from=backend-composer /vendor /var/www/html/vendor/
COPY .htaccess /var/www/html/
COPY autoload.php /var/www/html/
COPY index.php /var/www/html/
COPY composer.json /var/www/html/
COPY sampledata /var/www/html/sampledata

RUN mkdir /var/www/html/config

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80


#========================
FROM base as prod

COPY docker/entrypoint.sh /root/entrypoint.sh

ENTRYPOINT ["/root/entrypoint.sh"]


#========================
# This image is for running E2E tests only. When building a production
# image this step should not be used. (use: target prod)
FROM prod as tester

RUN apt-get update && apt-get install -y npm

# install Xdebug
RUN pecl install xdebug && docker-php-ext-enable xdebug

WORKDIR /var/www/html

# configure Xdebug
COPY docker/scripts/docker-php-ext-xdebug.ini /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# configure phpunit
COPY phpunit.xml .

COPY integration integration
COPY sampledata sampledata
COPY unit-tests unit-tests

RUN npm install npm@latest -g
RUN npm install -C integration
RUN export TC_API_URL=http://localhost
