---
layout: default
---

# Developer's Guide

## Application structure

The source code and therefore the application is separated in three submodules:

* Frontend: Angular based components to be loaded into the browser as single page application.

* Backend: PHP based components to handle most of the requests from frontend; connects to the database.

* Broadcaster: Additional server component to make websocket-connections between frontend and backend possible 

## Version Control (Git) Usage
* We generally adhere to the Commit-Message standard formulated [here](https://cbea.ms/git-commit/)
* In addition to the above rules we use the following prefixes for commit meesages:
  * [FE] for frontend changes
  * [BE] for backend changes
  * [BS] for broadcaster changes
  * [Setup] for changes to the infrastructure - container setup, CI script etc.

## Debugging
Xdebug is baked in the dev-container. install a Xdebug-browser extension like this 
https://github.com/lhall-adexos/xdebug-ext, set up "IDEA" as IDE-key, and
it should work out of the box with IDEA.

## Coding Standards
Use the .editorconfig-file.

### Typescript & Javascript
We are using ESLint with the base or [AirBnB](https://www.npmjs.com/package/eslint-config-airbnb)
with our [own rules](https://www.npmjs.com/package/@iqb/eslint-config) on top.

### PHP
Following mostly [PSR-12](https://www.php-fig.org/psr/psr-12/)

### Most important rules:
* Class names MUST be declared in StudlyCaps ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Method names MUST be declared in camelCase ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Class constants MUST be declared in all upper case with underscore separators.
  ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files MUST use only UTF-8 without BOM for PHP code. ([PSR-1](https://www.php-fig.org/psr/psr-1/))
* Files SHOULD either declare symbols (classes, functions, constants, etc.) or cause side-effects
  (e.g. generate output, change .ini settings, etc.) but SHOULD NOT do both. ([PSR-1](https://www.php-fig.org/psr/psr-1/))

#### Various rules and hints
* Types:
  * **Use native type hinting of modern PHP.**
  * Use PhpDoc *only* where PHP's native type hinting fails (because of the lack of Generics mostly)
* **Never `require` or `include` anywhere**, program uses autoload for all classes from the `classes`-dir.
  **Exception**: Unit-tests, where we want to define dependencies explicit in the test-file itself (and nowhere else).
* **Always throw exceptions in case of error.** They will be globally caught by ErrorHandler.
  When you are in the situation of catching an exception anywhere else it's 99% better not to throw the exception
  (since it's not an exception case most likely) but return false or null or the like.

### SQL
* Don't use allcaps.