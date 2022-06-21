ARG NODE_VERSION=14.19-buster-slim

FROM node:${NODE_VERSION} as dev

WORKDIR /app

COPY broadcasting-service/src /app/src
COPY broadcasting-service/package.json .
COPY broadcasting-service/nest-cli.docker.json /app/nest-cli.json
COPY broadcasting-service/tsconfig.json .
COPY broadcasting-service/tsconfig.build.json .
COPY common /common

RUN npm install

RUN npx nest build

EXPOSE 3000
CMD DEV_MODE=true npx nest start --watch --preserveWatchOutput


FROM node:${NODE_VERSION} as prod

COPY --from=dev /app/dist /app
COPY --from=dev /app/node_modules /app/node_modules

EXPOSE 80

CMD ["node", "/app/main.js"]