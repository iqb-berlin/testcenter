FROM php:7.4.9-apache-buster AS base

LABEL maintainer="IQB Berlin"
LABEL version="1.0"
LABEL description="The PHP backend of the test center. This container ist for DEVELOPMENT only, not for deployment since security guidelines are somehow weak."
LABEL license="MIT"

# dependencies, needed for composer
RUN apt-get update && apt-get install -y \
  wget \
  zlib1g-dev \
  libzip-dev \
  unzip
  # npm

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
COPY --chown=www-data:www-data ./ /var/www/html

# install composer dependencies
RUN sh scripts/install_composer.sh
RUN php composer.phar install

RUN vendor/bin/phpunit unit-tests/.

COPY docker/entrypoint.sh /root/entrypoint.sh

EXPOSE 80

#=================
FROM base as prod

ENTRYPOINT ["/root/entrypoint.sh"]

#==================
# This image is for running E2E tests only. When building a production
# image this step should not be used. (use: target prod)
FROM prod as tester

RUN apt-get update && apt-get install -y npm

WORKDIR /var/www/html

RUN npm install npm@latest -g
RUN npm install -C integration
RUN export TC_API_URL=http://localhost
