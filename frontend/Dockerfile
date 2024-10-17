# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
ARG NODE_VERSION=20.17-bookworm


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
EXPOSE 4200

CMD ["npx", "ng", "serve", "--configuration", "dev", "--disable-host-check", "--host", "0.0.0.0"]


FROM ${REGISTRY_PATH}nginx:1.26 AS prod
COPY --from=base /usr/src/testcenter/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
