# syntax=docker/dockerfile:1

FROM debian:bookworm-slim

RUN apt-get update  \
    && apt-get install -y nginx-extras luarocks

RUN unlink /etc/nginx/sites-enabled/default

RUN luarocks install lua-resty-redis
RUN luarocks install lua-resty-dns

COPY scripts/file-service/nginx.conf /etc/nginx/nginx.conf
COPY scripts/file-service/auth/ /usr/share/nginx/auth

RUN echo "" >> /etc/nginx/conf.d/cors.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]