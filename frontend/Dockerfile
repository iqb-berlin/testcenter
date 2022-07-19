FROM scm.cms.hu-berlin.de:4567/iqb/iqb-browsertest-container/iqb-browsertest-container:latest as dev

ENV CYPRESS_CACHE_FOLDER=/opt/cypress/cache
RUN mkdir /opt/cypress
RUN mkdir /opt/cypress/cache

WORKDIR /app

COPY common /common
COPY definitions /definitions
COPY frontend/.browserslistrc .
COPY frontend/angular.json .
COPY frontend/package.json .
COPY frontend/src /app/src
COPY frontend/tsconfig.json .

RUN npm install

# emulate top-level node-moduls for this script
RUN mkdir /node_modules
RUN cp -r /app/node_modules/ua-parser-js /node_modules/ua-parser-js
RUN ls -l /node_modules

# build prod
RUN npx ng build --configuration production --output-path=dist --output-hashing all

# prepare cypress TODO move into the base container
RUN apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
RUN chmod -R 777 /opt/cypress/cache

EXPOSE 4200
CMD npx ng serve --configuration dev --disable-host-check --host 0.0.0.0

FROM nginx:1.22.0-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
