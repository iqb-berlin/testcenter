# syntax=docker/dockerfile:1

ARG REGISTRY_PATH=""
FROM ${REGISTRY_PATH}debian:bookworm-slim

RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    nginx-extras \
    luarocks

RUN unlink /etc/nginx/sites-enabled/default

RUN luarocks install lua-resty-redis
RUN luarocks install lua-resty-dns

COPY file-service/nginx.conf /etc/nginx/nginx.conf
COPY file-service/auth/ /usr/share/nginx/auth

RUN echo "" >> /etc/nginx/conf.d/cors.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
