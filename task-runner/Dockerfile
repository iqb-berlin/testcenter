# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
FROM ${REGISTRY_PATH}node:lts-bookworm

WORKDIR /usr/src/testcenter/task-runner
RUN mkdir tmp

# Update npm to latest version
RUN npm --version
RUN --mount=type=cache,target=~/.npm \
    npm install -g --no-fund npm
RUN npm --version

COPY package*.json .
#RUN --mount=type=bind,source=package.json,target=package.json \
#    --mount=type=bind,source=package-lock.json,target=package-lock.json \
RUN --mount=type=cache,sharing=locked,target=~/.npm \
    npm ci --include=dev --no-fund
