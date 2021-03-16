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
  unzip \
  git

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
COPY config/customTexts.json /var/www/html/config/
COPY definitions /var/www/html/definitions
COPY docs /var/www/html/docs
COPY routes /var/www/html/routes
COPY sampledata /var/www/html/sampledata
COPY scripts /var/www/html/scripts
COPY unit-tests /var/www/html/unit-tests
COPY .htaccess /var/www/html/
COPY autoload.php /var/www/html/
COPY composer.json /var/www/html/
COPY composer.lock /var/www/html/
COPY index.php /var/www/html/

RUN chown -R www-data:www-data /var/www/html

# install composer dependencies
RUN sh scripts/install_composer.sh
RUN php composer.phar install

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

COPY integration /var/www/html/integration

RUN npm install npm@latest -g
RUN npm install -C integration
RUN export TC_API_URL=http://localhost
