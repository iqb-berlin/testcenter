ARG REGISTRY_PATH=""
ARG PHP_VERSION=8.3-apache-bookworm

# xsd download stage
FROM ${REGISTRY_PATH}composer:lts AS schema-downloader
# Verzeichnis für das Script erstellen
RUN mkdir -p /var/www/testcenter/data/.schemas
# Script kopieren und ausführen
COPY scripts/download-schemas.sh /tmp/download-schemas.sh
RUN chmod +x /tmp/download-schemas.sh && /tmp/download-schemas.sh


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

# add cache for xsd files
RUN mkdir -p /var/www/testcenter/data/.schemas
COPY scripts/download-schemas.sh /tmp/download-schemas.sh
RUN chmod +x /tmp/download-schemas.sh && /tmp/download-schemas.sh

COPY backend/src ./src/

RUN --mount=type=bind,source=backend/composer.json,target=composer.json \
    --mount=type=bind,source=backend/composer.lock,target=composer.lock \
    --mount=type=cache,target=/tmp/cache \
    composer install \
      --no-interaction \
      --no-dev \
      --ignore-platform-reqs


FROM ${REGISTRY_PATH}php:${PHP_VERSION} AS system
# Install PHP extensions
RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev

RUN docker-php-ext-install -j$(nproc) pdo_mysql zip opcache
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
RUN a2enconf servername
COPY backend/config/security.conf /etc/apache2/conf-available
RUN a2enconf security
RUN sed -i 's|Listen 80|Listen 8080|' /etc/apache2/ports.conf


# dev extensions are built here, before any application code is copied, so that
# code changes do not invalidate the (slow) xdebug/pcntl compilation
FROM system AS dev-extension
RUN pecl install xdebug-3.4.1 && docker-php-ext-enable xdebug   # @TODO: change xdebug and php release (xdebug-3.4.2 does not work with php-8.3.12!)
RUN docker-php-ext-install pcntl && docker-php-ext-enable pcntl


FROM system AS base
# Copy backend code
WORKDIR /var/www/testcenter/backend/
RUN chown -R www-data:www-data /var/www
RUN mkdir ./config && chown www-data:www-data ./config

COPY --chown=www-data:www-data backend/.htaccess .
COPY --chown=www-data:www-data backend/index.php .
COPY --chown=www-data:www-data backend/initialize.php .
COPY --chown=www-data:www-data backend/routes.php .
COPY --chown=www-data:www-data backend/src ./src

RUN mkdir -p ../data/.schemas && chown -R www-data:www-data ../data
COPY --chown=www-data:www-data --from=schema-downloader /var/www/testcenter/data/.schemas/ ../data/.schemas/
COPY --chown=www-data:www-data definitions ../definitions
COPY --chown=www-data:www-data package.json ../package.json
COPY --chown=www-data:www-data sampledata ../sampledata
COPY --chown=www-data:www-data scripts/database ../scripts/database

VOLUME /var/www/testcenter/data
EXPOSE 8080

COPY backend/entrypoint.sh /entrypoint.sh
COPY backend/initialize_only.sh /initialize_only.sh

ENTRYPOINT ["/entrypoint.sh"]


FROM base AS dev
# copy PHP dev extensions built in the dev-extension stage to the right spot
COPY --from=dev-extension /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=dev-extension /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

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

USER www-data


FROM base AS prod
# Copy prod dependencies
COPY --chown=www-data:www-data --from=prod-composer /usr/src/testcenter/backend/vendor/ ./vendor/
# Copy xsd files in cache folder
COPY --chown=www-data:www-data --from=prod-composer /var/www/testcenter/data/.schemas/ ../data/.schemas/
USER www-data
