FROM node:14.15.0 as dev

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
CMD npx nest start --watch --preserveWatchOutput


FROM nginx:1.19.1-alpine as prod

COPY --from=dev /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]