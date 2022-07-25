#!/bin/bash

cp /app-temp/package.json /app/package.json
cp /app-temp/package-lock.json /app/package-lock.json
rsync -arvq /app-temp/node_modules/ /app/node_modules

cd /app
chown -R $HOST_UID *

$TC_FRONTEND_RUN_COMMAND