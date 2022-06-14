# Developer's Guide

## Application structure

The source code and therefore the application is separated in three submodules:

* Frontend: Angular based components to be loaded into the browser as single page application.

* Backend: PHP based components to handle most of the requests from frontend; connects to the database.

* Broadcasting-Service: Additional server component to make websocket-connections between frontend and backend possible 

## Coding Standards

### Typescript
We are using ESLint with the base or [airbnb](https://www.npmjs.com/package/eslint-config-airbnb)
with our [own rules](https://www.npmjs.com/package/@iqb/eslint-config) on top.

#### PHP
Following mostly [PSR-12](https://www.php-fig.org/psr/psr-12/)

Most important:
* Class names MUST be declared in StudlyCaps ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Method names MUST be declared in camelCase ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Class constants MUST be declared in all upper case with underscore separators.
  ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files MUST use only UTF-8 without BOM for PHP code. ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files SHOULD either declare symbols (classes, functions, constants, etc.) or cause side-effects
  (e.g. generate output, change .ini settings, etc.) but SHOULD NOT do both. ([PSR-1](https://www.php-fig.org/psr/psr-1/))

### Various Rules and hints
* Always put a white line below function signature and two above!
* Use typed function signature as of php 7.1, arrays can be used as type, but will be replaced by typed array classes
  once 7.4 is default.
* Never `require` or `include` anywhere, program uses autoload for all classes from the `classes`-dir.
  Exception: Unit-tests, where we want to define dependencies explicit in the test-file itself (and nowhere else).
* Always throw exceptions in case of error. They will be globally caught by ErrorHandler.
  When you are in the situation of catching an exception anywhere else it's 99% better not to throw the exception
  (since it's not an exception case most likely) but return false or null ot the like.