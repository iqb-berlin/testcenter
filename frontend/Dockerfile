FROM iqbberlin/testcenter-frontend-dev-base:latest as dev

WORKDIR /app

COPY frontend/package.json .
RUN npm install

COPY common /common
COPY definitions /definitions
COPY frontend/.browserslistrc .
COPY frontend/angular.json .
COPY frontend/src /app/src
COPY frontend/tsconfig.json .

# emulate top-level node-modules for this script
RUN mkdir /node_modules
RUN cp -r /app/node_modules/ua-parser-js /node_modules/ua-parser-js
RUN ls -l /node_modules

# build prod
RUN npx ng build --configuration production --output-path=dist --output-hashing all

EXPOSE 4200
CMD npx ng serve --configuration dev --disable-host-check --host 0.0.0.0

FROM nginx:1.22.0-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]