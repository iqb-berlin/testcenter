# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
FROM ${REGISTRY_PATH}mysql:8.0

COPY --chmod=444 ../scripts/database/my.cnf /etc/mysql/conf.d/my.cnf

USER mysql
