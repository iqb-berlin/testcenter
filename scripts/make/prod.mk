TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

## Captured before the `include` below, which would otherwise be the last entry of MAKEFILE_LIST.
## Absolute, because the targets calling back into it change directory first.
THIS_MAKEFILE := $(abspath $(lastword $(MAKEFILE_LIST)))

include $(TC_BASE_DIR)/.env.prod

## prevents collisions of make target names with possible file names
.PHONY: testcenter-up testcenter-up-fg testcenter-down testcenter-start testcenter-stop testcenter-restart\
 	testcenter-status testcenter-logs testcenter-config testcenter-system-prune testcenter-volumes-prune\
 	testcenter-images-clean testcenter-connect-db testcenter-backup testcenter-restore testcenter-dump-db\
 	testcenter-restore-db testcenter-start-db testcenter-export-backend-vol testcenter-import-backend-vol\
 	testcenter-pull testcenter-init testcenter-update

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
		exec db psql --username=$(DB_USER) --dbname=$(DB_DATABASE)

## Backup set the single-step targets work on, relative to the installation directory, e.g.
## `make testcenter-dump-db BACKUP=backup/2026-09-08T10-42-00Z`.
BACKUP ?= backup/temp
DB_DUMP_FILE = $(TC_BASE_DIR)/$(BACKUP)/$(DB_DATABASE).sql
MANIFEST_FILE = $(TC_BASE_DIR)/$(BACKUP)/manifest

## Extract the application database into a plain SQL file
# Moved into place only on success: the shell truncates a redirect target before pg_dump runs, so
# writing directly would destroy the previous dump whenever a dump fails.
testcenter-dump-db:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db pg_dump --clean --if-exists --create --username=$(DB_USER)\
			--dbname=$(DB_DATABASE) >$(DB_DUMP_FILE).part\
	&& mv $(DB_DUMP_FILE).part $(DB_DUMP_FILE)\
	|| { rm -f $(DB_DUMP_FILE).part; echo "Database dump failed. '$(DB_DUMP_FILE)' is unchanged."; exit 1; }

## Restore the application database from the plain SQL file
# Connect to postgres because the dump drops and recreates the application database.
testcenter-restore-db:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.prod\
			--file docker-compose.yml\
			--file docker-compose.prod.yml\
		exec --no-TTY db psql --set ON_ERROR_STOP=on --username=$(DB_USER) --dbname=postgres\
			<$(DB_DUMP_FILE)

## Addressed by name rather than through the backend container, so both directions also work while
## the application is down. Mounted at its usual path, which is what the archive's paths are relative to.
BACKEND_VOLUME = $(COMPOSE_PROJECT_NAME)_backend_vol
BACKEND_VOLUME_DIR = /var/www/testcenter/data
BACKEND_VOLUME_ARCHIVE = $(TC_BASE_DIR)/$(BACKUP)/backend_vol.tar.gz

## Creates a gzip'ed tarball of the backend data files in the backup set
# The volume has to exist: `docker run` would otherwise create an empty one and archive nothing.
testcenter-export-backend-vol:
	docker volume inspect $(BACKEND_VOLUME) >/dev/null &&\
	docker run --rm\
			--volume $(BACKEND_VOLUME):$(BACKEND_VOLUME_DIR):ro\
			--volume $(TC_BASE_DIR)/$(BACKUP):/tmp\
		busybox tar czvf /tmp/backend_vol.tar.gz $(BACKEND_VOLUME_DIR)


## Extracts the backend data files of the backup set into the backend data volume
# The volume may be absent - importing into a deployment that has never run is a valid case, and the
# volume Compose uses afterwards is the one this creates.
# The data directory is replaced, not merged into, so that no file the archive lacks survives a
# restore. Since that discards data, a volume that already holds files needs FORCE=yes.
testcenter-import-backend-vol:
	@test -s $(BACKEND_VOLUME_ARCHIVE) ||\
		{ echo "No archive at '$(BACKEND_VOLUME_ARCHIVE)'. Nothing was changed."; exit 1; }
	@if [ "$(FORCE)" != "yes" ] &&\
		[ -n "$$(docker run --rm --volume $(BACKEND_VOLUME):$(BACKEND_VOLUME_DIR):ro busybox ls -A $(BACKEND_VOLUME_DIR))" ]; then\
			echo "The backend data volume is not empty. Repeat with FORCE=yes to replace its contents.";\
			exit 1;\
	fi
	docker run --rm\
			--volume $(BACKEND_VOLUME):$(BACKEND_VOLUME_DIR)\
			--volume $(TC_BASE_DIR)/$(BACKUP):/tmp\
		busybox sh\
			-c "find $(BACKEND_VOLUME_DIR) -mindepth 1 -delete &&\
				tar xvzf /tmp/backend_vol.tar.gz --strip-components 4 -C $(BACKEND_VOLUME_DIR)"

## Create a complete backup - database, backend data files and a manifest - as one timestamped set
## below `backup/`. The manifest is what tells a later restore that both halves belong together.
testcenter-backup:
	@set -e;\
	backup="backup/$$(date -u '+%Y-%m-%dT%H-%M-%SZ')";\
	mkdir -p $(TC_BASE_DIR)/$${backup};\
	echo "Creating backup set '$${backup}'";\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-dump-db BACKUP="$${backup}";\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-export-backend-vol BACKUP="$${backup}";\
	cd $(TC_BASE_DIR)/$${backup};\
	{\
		echo "version=$(VERSION)";\
		echo "database=$(DB_DATABASE)";\
		echo "created=$$(date -u '+%Y-%m-%dT%H:%M:%SZ')";\
		sha256sum $(DB_DATABASE).sql backend_vol.tar.gz;\
	} >manifest;\
	echo "Backup set '$${backup}' complete."

## Restore a complete backup set, e.g. `make testcenter-restore BACKUP=backup/2026-09-08T10-42-00Z`.
## Restores both halves with the application down, so it never starts on halves that do not match.
testcenter-restore:
	@set -e;\
	test -f $(MANIFEST_FILE) || {\
		echo "'$(BACKUP)' is not a backup set: no manifest.";\
		echo "Name a set created by 'make testcenter-backup', e.g. BACKUP=backup/2026-09-08T10-42-00Z";\
		exit 1;\
	};\
	echo "Verifying backup set '$(BACKUP)'";\
	( cd $(TC_BASE_DIR)/$(BACKUP) && grep -E '^[0-9a-f]{64} ' manifest | sha256sum --check --quiet );\
	echo "- both artifacts are intact";\
	backup_version=$$(sed -ne 's|^version=||p' $(MANIFEST_FILE));\
	test "$${backup_version}" = "$(VERSION)" ||\
		echo "- NOTE: the set was taken on version '$${backup_version}', this installation runs '$(VERSION)'";\
	echo "Stopping the application";\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-down;\
	echo "Starting the database on its own";\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-start-db;\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-restore-db BACKUP="$(BACKUP)";\
	echo "- database restored";\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-import-backend-vol BACKUP="$(BACKUP)" FORCE=yes;\
	echo "- data files restored";\
	$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-down;\
	echo "Restore complete. Start the application with 'make testcenter-up'."

## Start the database alone and wait until it accepts connections
testcenter-start-db:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			up --detach --wait db;\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			up --detach --wait db;\
	fi

## Pull the images of the configured version without starting or stopping anything.
testcenter-pull:
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			pull;\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			pull;\
	fi

## Install the database schema, apply pending patches and read the workspace files.
## Needed once before the first start and after every update; the backend refuses to serve while the
## schema does not match. Idempotent, so it is also the way to pick up files added to the data volume.
testcenter-init:
	@$(MAKE) --no-print-directory -f $(THIS_MAKEFILE) testcenter-start-db
	@if $(TLS_ENABLED); then\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.tls.yml\
			run --rm --entrypoint /initialize_only.sh backend;\
	else\
		cd $(TC_BASE_DIR);\
		docker compose\
				--env-file .env.prod\
				--file docker-compose.yml\
				--file docker-compose.prod.yml\
			run --rm --entrypoint /initialize_only.sh backend;\
	fi

# Start testcenter update procedure
testcenter-update:
	bash $(TC_BASE_DIR)/scripts/update.sh -s $(VERSION)
