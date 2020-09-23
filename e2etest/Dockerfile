FROM node:14-stretch

WORKDIR /e2e

RUN npm install \
  protractor \
  jasmine-spec-reporter \
  ts-node \
  typescript \
  tslib \
  @types/jest \
  webdriver-manager

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
           >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

COPY testcenter-frontend/e2e /e2e
COPY test/tsconfig.json /e2e/tsconfig.json
COPY test/protractor.conf.js /e2e/protractor.conf.js

RUN npx webdriver-manager update

CMD [ "sh", "-c", \
     "./node_modules/protractor/bin/protractor --baseUrl http://localhost protractor.conf.js"]
