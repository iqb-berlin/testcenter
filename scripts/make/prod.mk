TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

include $(TC_BASE_DIR)/.env.prod

## prevents collisions of make target names with possible file names
.PHONY: testcenter-up testcenter-up-fg testcenter-down testcenter-start testcenter-stop testcenter-restart\
 	testcenter-status testcenter-logs testcenter-config testcenter-system-prune testcenter-volumes-prune\
 	testcenter-images-clean testcenter-connect-db testcenter-dump-all testcenter-restore-all testcenter-dump-db\
 	testcenter-restore-db testcenter-dump-db-data-only testcenter-restore-db-data-only testcenter-export-backend-vol\
 	testcenter-import-backend-vol testcenter-update

## disables printing the recipe of a make target before executing it
.SILENT: testcenter-images-clean

## Pull newest images, create and start docker containers in background
testcenter-up:
	@if $(TLS_ENABLED); then\
		echo "Starting with TLS";\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			pull;\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			up --detach;\
	else\
		echo "Starting without TLS";\
		cd $(TC_BASE_DIR);\
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

## Pull newest images, create and start docker containers in foreground
testcenter-up-fg:
	@if $(TLS_ENABLED); then\
		echo "Starting with TLS";\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			pull;\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			up --abort-on-container-exit;\
	else\
		echo "Starting without TLS";\
		cd $(TC_BASE_DIR);\
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

## Stop and remove docker containers
testcenter-down:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			down;\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			down;\
	fi

## Start docker containers
# Param (optional): SERVICE - Start the specified service only, e.g. `make testcenter-start SERVICE=db`
testcenter-start:
	@if [ $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			start $(SERVICE);\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			start $(SERVICE);\
	fi

## Stop docker containers
# Param (optional): SERVICE - Stop the specified service only, e.g. `make testcenter-stop SERVICE=db`
testcenter-stop:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			stop $(SERVICE);\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			stop $(SERVICE);\
	fi

## Restart docker containers
# Param (optional): SERVICE - Restart the specified service only, e.g. `make testcenter-restart SERVICE=db`
testcenter-restart:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			restart $(SERVICE);\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			restart $(SERVICE);\
	fi

## Show status of containers
# Param (optional): SERVICE - Show status of the specified service only, e.g. `make testcenter-status SERVICE=db`
testcenter-status:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			ps -a $(SERVICE);\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			ps -a $(SERVICE);\
	fi

## Show service logs
# Param (optional): SERVICE - Show log of the specified service only, e.g. `make testcenter-logs SERVICE=db`
testcenter-logs:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			logs -f $(SERVICE);\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			logs -f $(SERVICE);\
	fi

## Show services configuration
# Param (optional): SERVICE - Show config of the specified service only, e.g. `make testcenter-config SERVICE=db`
testcenter-config:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			config $(SERVICE);\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			config $(SERVICE);\
	fi

## Remove unused dangling images, containers, networks, etc. Data volumes will stay untouched!
testcenter-system-prune:
	docker system prune

## Remove all anonymous local volumes not used by at least one container.
testcenter-volumes-prune:
	docker volume prune

## Remove all unused (not just dangling) images!
testcenter-images-clean:
	if test "$(shell docker images -f reference=iqbberlin/testcenter-* -q)";\
		then docker rmi $(shell docker images -f reference=iqbberlin/testcenter-* -q);\
	fi

## Open DB console
testcenter-connect-db:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec db mysql --user=$(MYSQL_USER) --password=$(MYSQL_PASSWORD) $(MYSQL_DATABASE)

## Extract all databases into a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/mysqldump-sql-format.html)
testcenter-dump-all:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db mysqldump --verbose --all-databases --add-drop-database --user=root\
			--password=$(MYSQL_ROOT_PASSWORD) >$(TC_BASE_DIR)/backup/temp/all-databases.sql

## Mysql interactive terminal reads commands from the dump file all-databases.sql
# (https://dev.mysql.com/doc/refman/8.0/en/reloading-sql-format-dumps.html)
testcenter-restore-all:
	sed -i 's/\/\*!40000 DROP DATABASE IF EXISTS `mysql`\*\/;/ /g' $(TC_BASE_DIR)/backup/temp/all-databases.sql &&\
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db mysql --verbose --user=root --password=$(MYSQL_ROOT_PASSWORD)\
			<$(TC_BASE_DIR)/backup/temp/all-databases.sql

## Extract a database into a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/mysqldump-sql-format.html)
testcenter-dump-db:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db mysqldump --verbose --add-drop-database --user=$(MYSQL_USER)\
			--password=$(MYSQL_PASSWORD) --databases $(MYSQL_DATABASE) >$(TC_BASE_DIR)/backup/temp/$(MYSQL_DATABASE).sql

## Restore a database from a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/reloading-sql-format-dumps.html)
testcenter-restore-db:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db mysql --verbose --user=$(MYSQL_USER) --password=$(MYSQL_PASSWORD)\
			<$(TC_BASE_DIR)/backup/temp/$(MYSQL_DATABASE).sql

## Extract a database data into a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/mysqldump-definition-data-dumps.html)
testcenter-dump-db-data-only:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db mysqldump --verbose --no-create-info --user=$(MYSQL_USER)\
			--password=$(MYSQL_PASSWORD) --databases $(MYSQL_DATABASE) >$(TC_BASE_DIR)/backup/temp/$(MYSQL_DATABASE)-data.sql

## Restore a database data from a sql format file
# (https://dev.mysql.com/doc/refman/8.0/en/reloading-sql-format-dumps.html)
testcenter-restore-db-data-only:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db mysql --verbose --user=$(MYSQL_USER) --password=$(MYSQL_PASSWORD)\
			<$(TC_BASE_DIR)/backup/temp/$(MYSQL_DATABASE)-data.sql

## Creates a gzip'ed tarball in temporary backup directory from backend data (backend has to be up!)
testcenter-export-backend-vol:
	@container_id=$$(docker compose ps -q backend 2>/dev/null); \
	docker run --rm \
		--volumes-from "$${container_id}" \
		--volume $(TC_BASE_DIR)/backup/temp:/tmp \
		busybox tar czvf /tmp/backend_vo_data.tar.gz /var/www/testcenter/data


## Extracts a gzip'ed tarball from temporary backup directory into backend data volume (backend has to be up!)
testcenter-import-backend-vol:
	@container_id=$$(docker compose ps -q backend 2>/dev/null); \
	docker run --rm\
			--volumes-from "$${container_id}"\
			--volume $(TC_BASE_DIR)/backup/temp:/tmp\
		busybox sh\
			-c "cd /var/www/testcenter/data && tar xvzf /tmp/backend_vo_data.tar.gz --strip-components 4"

# Start testcenter update procedure
testcenter-update:
	bash $(TC_BASE_DIR)/scripts/update.sh -s $(VERSION)
