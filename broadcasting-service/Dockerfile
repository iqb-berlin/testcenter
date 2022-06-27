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
COPY broadcasting-service/nest-cli.docker.json /app/nest-cli.json
COPY broadcasting-service/tsconfig.json .
COPY broadcasting-service/tsconfig.build.json .
COPY common /common

RUN npx nest build

EXPOSE 3000

COPY broadcasting-service/docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT /entrypoint.sh

FROM node:${NODE_VERSION} as prod

COPY --from=dev /app/dist /app

EXPOSE 80

CMD ["node", "/app/main.js"]