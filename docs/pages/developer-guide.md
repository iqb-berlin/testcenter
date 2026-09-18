---
layout: default
---

# Developer's Guide

## Application structure

The source code and therefore the application is separated in three submodules:

* Frontend: Angular based components to be loaded into the browser as single page application.

* Backend: PHP based components to handle most of the requests from frontend; connects to the database.

* Broadcaster: Additional server component to make websocket-connections between frontend and backend possible 

## Debugging
Xdebug is baked in the dev-container. install a Xdebug-browser extension like this 
https://github.com/lhall-adexos/xdebug-ext, set up "IDEA" as IDE-key, and
it should work out of the box with IDEA.

## Coding Standards
See the [style guide](../style-guide.md).
