FROM mysql:8.0

COPY ../scripts/database/my.cnf /etc/mysql/conf.d/my.cnf

RUN chmod 444 /etc/mysql/conf.d/my.cnf

USER mysql