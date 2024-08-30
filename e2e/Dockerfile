# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
FROM ${REGISTRY_PATH}cypress/browsers:node-20.17.0-chrome-128.0.6613.84-1-ff-129.0.2-edge-128.0.2739.42-1
WORKDIR /usr/src/testcenter/e2e

RUN npm --version
RUN --mount=type=cache,target=~/.npm \
    npm install -g --no-fund npm
RUN npm --version

# by setting CI environment variable we switch the Cypress install messages
# to small "started / finished" and avoid 1000s of lines of progress messages
# https://github.com/cypress-io/cypress/issues/1243
ENV CI=1
RUN --mount=type=bind,source=e2e/package.json,target=package.json \
    --mount=type=bind,source=e2e/package-lock.json,target=package-lock.json \
    --mount=type=cache,sharing=locked,target=~/.npm \
    npm ci --no-fund

# Install cypress and
# verify that Cypress has been installed correctly.
# running this command separately from "cypress run" will also cache its result
# to avoid verifying again when running the tests
RUN --mount=type=cache,target=~/.npm/_npx \
    npx cypress install && npx cypress verify
