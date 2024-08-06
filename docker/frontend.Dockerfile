# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.10.0-bookworm-slim


FROM node:${NODE_VERSION} AS dev
ARG NODE_ENV=development

RUN apt update && apt install -y chromium

WORKDIR /app

COPY frontend/package*.json ./

RUN chown -R node:node /app

USER node

RUN npm install

COPY frontend/angular.json .
COPY frontend/tsconfig.json .
COPY frontend/src /app/src
COPY common /common
COPY definitions /definitions

EXPOSE 4200

CMD ["npx", "ng", "serve", "--configuration", "dev", "--disable-host-check", "--host", "0.0.0.0"]

#===================================

FROM dev AS builder

RUN npx ng build --configuration production --output-path=dist --output-hashing all


FROM nginx:1.25 AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./frontend/config/nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
