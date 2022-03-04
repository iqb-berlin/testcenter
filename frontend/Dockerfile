FROM scm.cms.hu-berlin.de:4567/iqb/iqb-browsertest-container/iqb-browsertest-container:latest as dev

WORKDIR /app

COPY frontend/src /app/src
COPY frontend/.browserslistrc .
COPY frontend/angular.json .
COPY frontend/tsconfig.json .
COPY frontend/package.json .
COPY common /common

RUN npm install

# emulate top-level node-moduls for this script
RUN mkdir /node_modules
RUN cp -r /app/node_modules/ua-parser-js /node_modules/ua-parser-js
RUN ls -l /node_modules

# build prod
RUN npx ng build --configuration production --output-path=dist

EXPOSE 4200
CMD npx ng serve --configuration dev --disable-host-check --host 0.0.0.0

FROM nginx:1.19.1-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


#RUN npm i --prefix=./node_modules/protractor --save webdriver-manager@latest
#RUN npx webdriver-manager clean
#RUN npx webdriver-manager update --versions.chrome=`google-chrome --product-version`