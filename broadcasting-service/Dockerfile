ARG NODE_VERSION=14.19-buster-slim

FROM node:${NODE_VERSION} as dev

ARG NODE_ENV=development
ARG HOST_UID
ENV HOST_UID=$HOST_UID

RUN mkdir /app-temp
WORKDIR /app-temp

COPY broadcasting-service/package.json .
COPY broadcasting-service/package-lock.json .
RUN npm install

COPY broadcasting-service/src /app/src
COPY broadcasting-service/docker/nest-cli.json /app/nest-cli.json
COPY broadcasting-service/tsconfig.json /app/tsconfig.json
COPY broadcasting-service/tsconfig.build.json /app/tsconfig.build.json
COPY common /common

RUN npx nest build

EXPOSE 3000

COPY broadcasting-service/docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT /entrypoint.sh

FROM dev as builder
RUN ln -s /app-temp/node_modules /app/node_modules

WORKDIR /app
RUN npx nest build -p tsconfig.build.json

FROM node:${NODE_VERSION} as prod

COPY --from=builder /app/dist /app

EXPOSE 80

CMD ["node", "/app/main.js"]