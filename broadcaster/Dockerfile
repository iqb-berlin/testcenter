# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
ARG NODE_VERSION=22.16-bookworm-slim

FROM ${REGISTRY_PATH}node:${NODE_VERSION} AS base

# Update npm to latest version
RUN npm --version
RUN --mount=type=cache,sharing=locked,target=~/.npm \
    npm install -g --no-fund npm
RUN npm --version

WORKDIR /usr/src/testcenter/broadcaster

COPY common ../common
COPY broadcaster/package*.json .
COPY broadcaster/nest-cli.json .
COPY broadcaster/tsconfig.json .
COPY broadcaster/tsconfig.spec.json .
COPY broadcaster/src ./src


FROM base AS build
ENV NODE_ENV=production

# Install dependencies
RUN --mount=type=cache,target=~/.npm \
    npm ci --include=dev --no-fund

# Build project
RUN npx nest info
RUN npx nest build


FROM build AS dev
ENV DEV_MODE="true"

RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    procps # needed for webpack not to crash on file change

EXPOSE 3000

CMD ["npx", "nest", "start", "--watch", "--preserveWatchOutput"]


FROM ${REGISTRY_PATH}node:${NODE_VERSION} AS prod
ENV NODE_ENV=production

USER node
WORKDIR /var/www/broadcaster

# Production code
COPY --chown=node:node --from=build /usr/src/testcenter/broadcaster/dist/ ./

# Install dependencies
RUN --mount=type=bind,source=broadcaster/package.json,target=package.json \
    --mount=type=bind,source=broadcaster/package-lock.json,target=package-lock.json \
    --mount=type=cache,sharing=locked,target=~/.npm \
    npm ci --omit=dev --no-fund

EXPOSE 3000

CMD ["node", "main.js"]
