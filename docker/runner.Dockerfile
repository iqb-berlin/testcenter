FROM iqbberlin/testcenter-frontend-dev-base:latest

ARG NODE_ENV=development

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install --only=dev

RUN mkdir -p /app/tmp
