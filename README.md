[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Travis (.com)](https://img.shields.io/travis/com/iqb-berlin/testcenter-broadcasting-service?style=flat-square)](https://travis-ci.com/iqb-berlin/testcenter-broadcasting-service)
![GitHub package.json version](https://img.shields.io/github/package-json/v/iqb-berlin/testcenter-broadcasting-service?style=flat-square)

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
