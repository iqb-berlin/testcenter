FROM node:14-stretch

WORKDIR /e2e

RUN npm install \
  protractor \
  jasmine-spec-reporter \
  ts-node \
  typescript \
  tslib \
  @types/jest

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
           >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

COPY ./testcenter-frontend/e2e /e2e
COPY ./e2etest/tsconfig.json /e2e/tsconfig.json
COPY ./e2etest/protractor.conf.js /e2e/protractor.conf.js

# install webdriver for browser testing
RUN npm i --prefix=./node_modules/protractor --save webdriver-manager@latest
RUN npx webdriver-manager clean
RUN npx webdriver-manager update --versions.chrome=`google-chrome --product-version`

CMD [ "sh", "-c", \
     "./node_modules/protractor/bin/protractor --baseUrl http://testcenter-frontend protractor.conf.js"]
