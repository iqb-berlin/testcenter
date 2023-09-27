FROM debian:buster-slim

RUN apt-get update  \
    && apt-get install -y nginx-extras luarocks

RUN unlink /etc/nginx/sites-enabled/default

RUN luarocks install lua-resty-redis
RUN luarocks install lua-resty-dns

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]