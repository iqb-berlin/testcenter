FROM node:14.15.0 as dev

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
RUN npm install

# install webdriver for browser testing
RUN npm i --prefix=./node_modules/protractor --save webdriver-manager@latest
RUN npx webdriver-manager clean
RUN npx webdriver-manager update --versions.chrome=`google-chrome --product-version`

COPY . /app

RUN ng build --prod=true --output-path=dist

EXPOSE 4200

CMD ng serve --disableHostCheck --host 0.0.0.0

# ===========================================

FROM nginx:1.19.1-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
