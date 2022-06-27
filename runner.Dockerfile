FROM iqbberlin/testcenter-frontend-dev-base:latest

ARG NODE_ENV=development
ARG HOST_UID
ENV HOST_UID=$HOST_UID

RUN mkdir /app-temp
WORKDIR /app-temp

COPY package.json .
COPY package-lock.json .
RUN npm install --only=dev

RUN mkdir -p /app/tmp

COPY docker/runner-entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]