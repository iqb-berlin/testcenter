---
layout: default
---

# Installation for development

The other way of installation gives you more options to access data, logs, to change settings more in 
detail, to find bugs and even to change code to meet your needs. Our applications are great, 
but not perfect at all!

Technically, you check out all source code and build the application modules as developers do. 
The whole Angular development framework will be installed with all tools. 
The build process will include all unit end e2e tests we prepared.

We will not explain every step in detail. You should be familiar with git and bash and file 
handling in Unix, editing a text file etc.

TODO explain IDEA stuff etc.

## Preconditions

Before you follow the instructions below, you need to 
install [Docker](https://docs.docker.com/engine/install/ubuntu/#installation-methods), and `make`.
We do not explain these applications, this is beyond the scope of this document.

* Docker 20
* [Docker-compose plugin](https://docs.docker.com/compose/install/linux/) 
* Make 4.3

Although all steps below could be done in another operating system environment, we go for a unix/linux.

## 1. Install
Clone this repository

## 2. Configure

Run

```
make init
```

> :warning: This creates configuration files with values meant for
development purposes only. For any production setup be sure to customize the files.
Most importantly use your own passwords!

The important configuration files are:

* `.env.dev` - This file contains sensitive information about database access
and user logins

* `frontend/src/environments/environment.ts` - Here information about accessing the backend is kept for 
the frontend component

There is one important setting to be made in the generated file `.env.dev`.
On the first line, set the variable _HOSTNAME_ to either the IP, or the hostname of the machine
under which it is reachable, in case `localhost` does not work.


## 3. Run
```
make build
make up
```


## 3. Update

```
git pull
make build
```

# Login

After installation two logins are prepared:

- Username `super` and password `user123` as admin user

- Username `test` and password `user123` and code `xxx` as test-taker