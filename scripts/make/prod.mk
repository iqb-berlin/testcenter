include .env.prod

## prevents collisions of make target names with possible file names
.PHONY: run run-detached down start stop restart status logs config system-prune volumes-prune images-clean connect-db \
	dump-all restore-all dump-db restore-db dump-db-data-only restore-db-data-only export-backend-vol import-backend-vol \
	update

## disables printing the recipe of a make target before executing it
.SILENT: images-clean

## Pull newest images, create and start docker containers in foreground
run:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		echo "Starting with TLS";\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			pull;\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			up --abort-on-container-exit;\
	else\
		echo "Starting without TLS";\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			pull;\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			up --abort-on-container-exit;\
	fi

## Pull newest images, create and start docker containers in background
run-detached:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		echo "Starting with TLS";\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			pull;\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			up --detach;\
	else\
		echo "Starting without TLS";\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			pull;\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			up --detach;\
	fi

## Stop and remove docker containers
down:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			down;\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			down;\
	fi

## Start docker containers
# Param (optional): SERVICE - Start the specified service only, e.g. `make start SERVICE=testcenter-db`
start:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			start $(SERVICE);\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			start $(SERVICE);\
	fi

## Stop docker containers
# Param (optional): SERVICE - Stop the specified service only, e.g. `make stop SERVICE=testcenter-db`
stop:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			stop $(SERVICE);\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			stop $(SERVICE);\
	fi

## Restart docker containers
# Param (optional): SERVICE - Restart the specified service only, e.g. `make start SERVICE=testcenter-db`
restart:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			restart $(SERVICE);\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			restart $(SERVICE);\
	fi

## Show status of containers
# Param (optional): SERVICE - Show status of the specified service only, e.g. `make status SERVICE=testcenter-db`
status:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			ps -a $(SERVICE);\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			ps -a $(SERVICE);\
	fi

## Show service logs
# Param (optional): SERVICE - Show log of the specified service only, e.g. `make logs SERVICE=testcenter-db`
logs:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			logs -f $(SERVICE);\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			logs -f $(SERVICE);\
	fi

## Show services configuration
# Param (optional): SERVICE - Show config of the specified service only, e.g. `make config SERVICE=testcenter-db`
config:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
				--file docker-compose.prod.tls.yml\
			config $(SERVICE);\
	else\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			config $(SERVICE);\
	fi

## Remove unused dangling images, containers, networks, etc. Data volumes will stay untouched!
system-prune:
	docker system prune

## Remove all anonymous local volumes not used by at least one container.
volumes-prune:
	docker volume prune

## Remove all unused (not just dangling) images!
images-clean:
	if test "$(shell docker images -f reference=iqbberlin/testcenter-* -q)";\
		then docker rmi $(shell docker images -f reference=iqbberlin/testcenter-* -q);\
	fi

## Open DB console
connect-db:
	docker exec -it testcenter-db mysql --user=$(MYSQL_USER) --password=$(MYSQL_PASSWORD) $(MYSQL_DATABASE)

## Extract all databases into a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/mysqldump-sql-format.html)
dump-all:
	docker exec testcenter-db mysqldump --verbose --all-databases --add-drop-database --user=root\
		--password=$(MYSQL_ROOT_PASSWORD) >backup/temp/all-databases.sql

## Mysql interactive terminal reads commands from the dump file all-databases.sql
# (https://dev.mysql.com/doc/refman/8.0/en/reloading-sql-format-dumps.html)
restore-all:
	sed -i 's/\/\*!40000 DROP DATABASE IF EXISTS `mysql`\*\/;/ /g' backup/temp/all-databases.sql
	docker exec -i testcenter-db mysql --verbose --user=root --password=$(MYSQL_ROOT_PASSWORD)\
		<backup/temp/all-databases.sql

## Extract a database into a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/mysqldump-sql-format.html)
dump-db:
	docker exec testcenter-db mysqldump --verbose --add-drop-database --user=$(MYSQL_USER)\
		--password=$(MYSQL_PASSWORD) --databases $(MYSQL_DATABASE) >backup/temp/$(MYSQL_DATABASE).sql

## Restore a database from a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/reloading-sql-format-dumps.html)
restore-db:
	docker exec -i testcenter-db mysql --verbose --user=$(MYSQL_USER) --password=$(MYSQL_PASSWORD)\
		<backup/temp/$(MYSQL_DATABASE).sql

## Extract a database data into a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/mysqldump-definition-data-dumps.html)
dump-db-data-only:
	docker exec testcenter-db mysqldump --verbose --no-create-info --user=$(MYSQL_USER)\
		--password=$(MYSQL_PASSWORD) --databases $(MYSQL_DATABASE) >backup/temp/$(MYSQL_DATABASE)-data.sql

## Restore a database data from a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/reloading-sql-format-dumps.html)
restore-db-data-only:
	docker exec -i testcenter-db mysql --verbose --user=$(MYSQL_USER) --password=$(MYSQL_PASSWORD)\
		<backup/temp/$(MYSQL_DATABASE)-data.sql

## Creates a gzip'ed tarball in temporary backup directory from backend data volume
export-backend-vol:
	vackup export testcenter_testcenter_backend_vo_data backup/temp/backend_vo_data.tar.gz

## Extracts a gzip'ed tarball from temporary backup directory into backend data volume (sudo rights may be required)
import-backend-vol:
	vackup import backup/temp/backend_vo_data.tar.gz testcenter_testcenter_backend_vo_data

# Start testcenter update procedure
update:
	bash scripts/update.sh
