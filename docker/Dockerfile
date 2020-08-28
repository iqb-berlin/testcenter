FROM php:7.4.9-apache-buster

LABEL maintainer="IQB Berlin"
LABEL version="1.0"
LABEL description="The PHP backend of the test center. This container ist for DEVELOPMENT only, not for deployment since security guidelines are somehow weak."
LABEL license="MIT"

ARG MYSQL_HOST
ARG MYSQL_PORT
ARG MYSQL_DATABASE
ARG MYSQL_USER
ARG MYSQL_PASSWORD

# dependencies, needed for composer
RUN apt-get update && apt-get install -y \
    wget \
    zlib1g-dev \
    libzip-dev \
    unzip \
    npm

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

WORKDIR /var/www/html

RUN npm install npm@latest -g
RUN npm install -C integration
RUN export TC_API_URL=http://localhost

COPY unit-tests unit-tests
COPY integration integration

COPY config/DBConnectionData.template.json /tmp/DBConnectionData.template.json
RUN sed \
-e s/'<type>'/mysql/ \
-e s/'<host>'/${MYSQL_HOST}/ \
-e s/'<port>'/${MYSQL_PORT}/ \
-e s/'<name>'/${MYSQL_DATABASE}/ \
-e s/'<user>'/${MYSQL_USER}/ \
-e s/'<password>'/${MYSQL_PASSWORD}/ \
/tmp/DBConnectionData.template.json > /var/www/html/config/DBConnectionData.json

EXPOSE 80

COPY docker/entrypoint.sh /root/entrypoint.sh
ENTRYPOINT ["/root/entrypoint.sh"]
