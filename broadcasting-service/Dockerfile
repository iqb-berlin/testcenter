# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
ARG NODE_VERSION=22.16-bookworm-slim

FROM ${REGISTRY_PATH}node:${NODE_VERSION} AS base
ENV NODE_ENV=production

WORKDIR /usr/src/testcenter/broadcasting-service

# Update npm to latest version
RUN npm --version
RUN --mount=type=cache,sharing=locked,target=~/.npm \
    npm install -g --no-fund npm
RUN npm --version

COPY common ../common
COPY broadcasting-service/package*.json .
COPY broadcasting-service/nest-cli.json .
COPY broadcasting-service/tsconfig.json .
COPY broadcasting-service/tsconfig.spec.json .
COPY broadcasting-service/src ./src

# Install dependencies
RUN --mount=type=cache,sharing=locked,target=~/.npm \
    npm ci --include=dev --no-fund

# Build project
RUN npx nest info
RUN npx nest build

EXPOSE 3000


FROM base AS dev

#turn extensive logging on (can be overwritten in compose file)
ENV DEV_MODE="true"

RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    procps # needed for webpack not to crash on file change

CMD ["npx", "nest", "start", "--watch", "--preserveWatchOutput"]


FROM base AS prod
WORKDIR /var/www/broadcasting-service

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,sharing=locked,target=~/.npm \
    npm ci --omit=dev --no-fund

RUN chown -R node:node /usr/src/testcenter
COPY --chown=node:node --from=base /usr/src/testcenter/broadcasting-service/node_modules/ node_modules/
COPY --chown=node:node --from=base /usr/src/testcenter/broadcasting-service/dist/ ./
USER node

CMD ["node", "main.js"]
