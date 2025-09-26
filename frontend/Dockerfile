# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
ARG NODE_VERSION=22.16-bookworm


FROM ${REGISTRY_PATH}node:${NODE_VERSION} AS base
ARG NODE_ENV=development

RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    chromium

# Update npm to latest version
RUN npm --version
RUN --mount=type=cache,target=~/.npm \
    npm install -g --no-fund npm
RUN npm --version

WORKDIR /usr/src/testcenter/frontend

COPY frontend/package*.json .
RUN --mount=type=cache,sharing=locked,target=~/.npm \
    npm ci --no-fund

COPY frontend/angular.json .
COPY frontend/tsconfig.json .
COPY frontend/src src/
COPY common ../common
COPY definitions ../definitions

RUN --mount=type=cache,sharing=locked,target=~/.angular/cache \
    npx ng build \
      --configuration production \
      --output-path=dist \
      --output-hashing all


FROM base AS dev
EXPOSE 8080

COPY frontend/proxy.conf.json .
RUN sed -i "s|localhost:3000|broadcaster:3000|" proxy.conf.json
RUN sed -i "s|localhost:8090|backend:8080|" proxy.conf.json
RUN sed -i "s|localhost:8099|file-server:8080|" proxy.conf.json

ENTRYPOINT ["npx", "ng"]


FROM ${REGISTRY_PATH}nginxinc/nginx-unprivileged:stable AS prod
USER root
RUN chown -R nginx:root /usr/share/nginx/html

USER nginx
COPY --chown=nginx:root --from=base /usr/src/testcenter/frontend/dist /usr/share/nginx/html
COPY --chown=nginx:root frontend/nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
