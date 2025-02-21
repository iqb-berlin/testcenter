# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
ARG PHP_VERSION=8.3.12-apache-bookworm


FROM ${REGISTRY_PATH}composer:lts AS dev-composer
WORKDIR /usr/src/testcenter/backend
COPY backend/src ./src/
COPY backend/test/unit/test-helper ./test/unit/test-helper

RUN --mount=type=bind,source=backend/composer.json,target=composer.json \
    --mount=type=bind,source=backend/composer.lock,target=composer.lock \
    --mount=type=cache,target=/tmp/cache \
    composer install \
      --no-interaction \
      --ignore-platform-reqs


FROM ${REGISTRY_PATH}composer:lts AS prod-composer
WORKDIR /usr/src/testcenter/backend
COPY backend/src ./src/

RUN --mount=type=bind,source=backend/composer.json,target=composer.json \
    --mount=type=bind,source=backend/composer.lock,target=composer.lock \
    --mount=type=cache,target=/tmp/cache \
    composer install \
      --no-interaction \
      --no-dev \
      --ignore-platform-reqs


FROM ${REGISTRY_PATH}php:${PHP_VERSION} AS base
# Install PHP extensions
RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev

RUN docker-php-ext-install -j$(nproc) pdo_mysql zip
RUN pecl install igbinary && docker-php-ext-enable igbinary
RUN pecl install redis && docker-php-ext-enable redis

# Configure PHP runtime
COPY backend/config/local.php.ini /usr/local/etc/php/conf.d/local.ini

# Configure Apache
RUN a2enmod rewrite
RUN a2enmod headers
RUN a2dissite 000-default
COPY backend/config/vhost.conf /etc/apache2/sites-available
RUN a2ensite vhost
RUN echo "ServerName localhost" >> /etc/apache2/conf-available/servername.conf
COPY backend/config/security.conf /etc/apache2/conf-available
RUN a2enconf servername
RUN a2enconf security

# Copy backend code
WORKDIR /var/www/testcenter/backend/
RUN mkdir ./config

COPY backend/.htaccess .
COPY backend/index.php .
COPY backend/initialize.php .
COPY backend/routes.php .
COPY backend/src ./src

RUN mkdir ../data
COPY definitions ../definitions
COPY package.json ../package.json
COPY sampledata ../sampledata
COPY scripts/database ../scripts/database

RUN chown -R www-data:www-data /var/www

VOLUME /var/www/testcenter/data
EXPOSE 80

COPY backend/entrypoint.sh /entrypoint.sh
CMD ["apache2-foreground"]


FROM base AS dev
# Install PHP dev extensions
RUN pecl install xdebug-3.4.1 && docker-php-ext-enable xdebug   # @TODO: change xdebug and php release (xdebug-3.4.2 does not work with php-8.3.12!)
RUN docker-php-ext-install pcntl && docker-php-ext-enable pcntl

# Copy dev dependencies
COPY --chown=www-data:www-data --from=dev-composer /usr/src/testcenter/backend/vendor/ vendor/

# Add testing code
COPY --chown=www-data:www-data backend/phpunit.xml .
COPY --chown=www-data:www-data backend/test ./test

# some initialization tests need this
# jq - JSON parser for bash
RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    jq


FROM base AS prod
# Copy prod dependencies
COPY --chown=www-data:www-data --from=prod-composer /usr/src/testcenter/backend/vendor/ ./vendor/

#USER www-data
