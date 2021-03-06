[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://scm.cms.hu-berlin.de/iqb/testcenter-broadcasting-service/badges/master/pipeline.svg)](https://scm.cms.hu-berlin.de/iqb/testcenter-broadcasting-service)
![GitHub package.json version](https://img.shields.io/github/package-json/v/iqb-berlin/testcenter-broadcasting-service)

# Testcenter - Broadcasting Service

Small service for the so called supervising monitor of the IQB-testcenter. 

This is only on part of the program, and not intended to be used alone. Find the whole Project [here](https://github.com/iqb-berlin/testcenter-setup).

# Development

For development you can build and run this component alone.

## Docker
[Get the image here](https://hub.docker.com/repository/docker/iqbberlin/testcenter-broadcasting-service) or run
```
make build-image
cd docker
docker build
docker run
```
## Local Installation

### Prerequisites
* Node
* NPM

### Installation

```bash
$ npm install
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

TODO There are no tests right now

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Debugging

To activate very verbose console logging change  `logger: ['warn', 'error']`
to `logger: console` in `src/main.ts`.
