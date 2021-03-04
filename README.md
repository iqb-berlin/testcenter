[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Travis (.com)](https://img.shields.io/travis/com/iqb-berlin/testcenter-backend?style=flat-square)](https://travis-ci.com/iqb-berlin/testcenter-backend)
![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/iqb-berlin/testcenter-backend?style=flat-square)

# Testcenter Backend

This is the backend of the Testcenter application.  

In older versions it's also the backend for the now deprecated
Testcenter-Admin application.

You can find the frontend [here](https://github.com/iqb-berlin/testcenter-frontend).

The repository for a complete setup of the application can be found
[here](https://github.com/iqb-berlin/testcenter-setup).

## Documentation

Find API documentation and other docs [here](https://iqb-berlin.github.io/testcenter-backend).

## Bug Reports

File bug reports, feature requests etc. [here](https://github.com/iqb-berlin/testcenter-backend/issues).

## Installation

### With Docker (recommended)

All the necessary commands for running the application and starting the tests
can be found in the Makefile on the root directory.

Alternatively you can download the container [here](https://hub.docker.com/repository/docker/iqbberlin/testcenter-backend).

###### Start and Stop the server
```
make run
make stop
```
###### The 2 types of tests can be run separately.
```
make test-unit
make test-e2e
```

###### Manual installation on Webserver
* See [Manual Installation](./manual_installation.md)

## Upgrade from previous versions
Pull the version(-tag) you want and lookup UPGRADE.md for important changes!

## Tests

### With Docker (recommended)
```
make test-unit
make test-e2e
```

### Run tests on your (host) machine
#### Unit tests

```
vendor/bin/phpunit unit-tests
```

#### E2E/API-Tests

These tests test the in-/output of all endpoints against the API Specification using [Dredd](https://dredd.org).

##### Preparation:
* install Node modules
```
npm --prefix=integration install
```

* If your backend is not running under `http://localhost`, use env `TC_API_URL` variable to set up it's URI
```
export TC_API_URL=http://localhost/testcenter-iqb-php
  &&  npm --prefix=integration run dredd_test
```

##### Run the E2E/API-Tests
```
 npm --prefix=integration run dredd_test
```

##### Run E2E/API-Tests against persistent database
If you want to run the e2e-tests against a persistent database, MySQL or PostgreSQL, do the following:
- in `/config` create a file `DBConnectionData.e2etest.json` analogous to `DBConnectionData.json` with your connection
- also in `/config` create a file `e2eTests.json`with the content `{"configFile": "e2etest"}`
- **Be really careful**: Running the tests this way will *erase all your data* from the data dir `vo_data` and the
specified database.


## Development
### Coding Standards

Following mostly [PSR-12](https://www.php-fig.org/psr/psr-12/)

Most important:
* Class names MUST be declared in StudlyCaps ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Method names MUST be declared in camelCase ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Class constants MUST be declared in all upper case with underscore separators.
([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files MUST use only UTF-8 without BOM for PHP code. ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files SHOULD either declare symbols (classes, functions, constants, etc.) or cause side-effects
(e.g. generate output, change .ini settings, etc.) but SHOULD NOT do both. ([PSR-1](https://www.php-fig.org/psr/psr-1/))

#### Various Rules and hints

* Always put a white line below function signature and two above!
* Use typed function signature as of php 7.1, arrays can be used as type, but will be replaced by typed array classes
once 7.4 is default.
* Never `require` or `include` anywhere, program uses autoload for all classes from the `classes`-dir.
Exception: Unit-tests, where we want to define dependencies explicit in the test-file itself (and nowhere else).
* Always throw exceptions in case of error. They will be globally caught by ErrorHandler.
When you are in the situation of catching an exception anywhere else it's 99% better not to throw the exception
(since it's not an exception case most likely) but return false or null ot the like.
