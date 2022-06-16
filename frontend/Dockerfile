FROM scm.cms.hu-berlin.de:4567/iqb/iqb-browsertest-container/iqb-browsertest-container:latest as dev

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
RUN npx ng build --configuration production --output-path=dist

EXPOSE 4200
CMD npx ng serve --configuration dev --disable-host-check --host 0.0.0.0

FROM nginx:1.22.0-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
