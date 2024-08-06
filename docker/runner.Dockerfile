# syntax=docker/dockerfile:1

FROM node:16.19-bullseye

ARG NODE_ENV=development

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN --mount=type=cache,sharing=locked,target=~/.npm \
    npm install --only=dev

RUN mkdir -p /app/tmp
