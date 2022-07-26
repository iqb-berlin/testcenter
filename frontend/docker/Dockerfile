FROM iqbberlin/testcenter-frontend-dev-base:latest as dev

ARG NODE_ENV=development
ARG HOST_UID
ENV HOST_UID=$HOST_UID

# prepare CyPress Cache-Folder (we do it here, not in base image because of the different UID)
ENV CYPRESS_CACHE_FOLDER=/opt/cypress/cache
RUN mkdir /opt/cypress && mkdir /opt/cypress/cache

WORKDIR /app

RUN mkdir /app-temp
WORKDIR /app-temp

COPY frontend/package.json .
COPY frontend/package-lock.json .
RUN npm install

# has to be done after npm install, because host user shall be allowed to use it
RUN chmod -R 777 /opt/cypress/cache

# emulate top-level node-modules for this script TODO
RUN mkdir /node_modules
RUN cp -r /app-temp/node_modules/ua-parser-js /node_modules/ua-parser-js

COPY frontend/angular.json .
COPY frontend/tsconfig.json .
COPY frontend/.browserslistrc .
COPY frontend/src /app-temp/src
COPY common /common
COPY definitions /definitions

# ng build needs to run once here, otherwise the Angular compiler Ivy bugs out
RUN npx ng build

EXPOSE 4200

COPY frontend/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT /entrypoint.sh

FROM dev as builder
RUN ln -s /node_modules-temp/node_modules /app/node_modules
RUN npx ng build --configuration production --output-path=dist --output-hashing all

FROM nginx:1.22.0-alpine as prod

COPY --from=builder /app-temp/dist /usr/share/nginx/html
COPY ./frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]