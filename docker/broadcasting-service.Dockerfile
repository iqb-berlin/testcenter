# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.9.0-bookworm-slim

FROM node:${NODE_VERSION} AS dev

ARG NODE_ENV=development
ENV DEV_MODE="true"

RUN apt-get update && apt-get -y install procps # needed for webpack not to crash on file change

WORKDIR /app

COPY broadcasting-service/package*.json ./

RUN chown -R node:node /app

USER node

RUN npm install

COPY broadcasting-service/src /app/src
COPY common /common
COPY broadcasting-service/nest-cli.json /app/nest-cli.json
COPY broadcasting-service/tsconfig.json /app/tsconfig.json
COPY broadcasting-service/tsconfig.spec.json /app/tsconfig.spec.json

EXPOSE 3000

CMD ["npx", "nest", "start", "--watch", "--preserveWatchOutput"]


FROM dev AS build
RUN npx nest build


FROM node:${NODE_VERSION} AS prod

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app

EXPOSE 3000

CMD ["node", "/app/main.js"]
