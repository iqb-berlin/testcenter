#!/bin/bash

cp /app-temp/package.json /app/package.json
cp /app-temp/package-lock.json /app/package-lock.json
cp -R /app-temp/node_modules/ /app

cd /app
chown -R $HOST_UID *
DEV_MODE=true npx nest start --watch --preserveWatchOutput