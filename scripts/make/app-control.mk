#TC_BASE_DIR := $(shell git rev-parse --show-toplevel)
TC_BASE_DIR := .

## prevents collisions of make target names with possible file names
.PHONY: init build up down start stop log build-prod-local up-prod-local down-prod-local log-prod-local

# Initialized the Application. Run this right after checking out the Repo.
init:
	cp $(TC_BASE_DIR)/docker/default.env $(TC_BASE_DIR)/docker/.env
	cp $(TC_BASE_DIR)/frontend/src/environments/environment.dev.ts $(TC_BASE_DIR)/frontend/src/environments/environment.ts
	chmod 0444 $(TC_BASE_DIR)/scripts/database/my.cnf # mysql does not accept it with more rights
	chmod 0644 $(TC_BASE_DIR)/scripts/database/000-create-test-db.sh # with more rights it does fail with seemingly unrelated error
	mkdir -p $(TC_BASE_DIR)/docs/dist
	chmod 777 $(TC_BASE_DIR)/docs/dist
	mkdir -p $(TC_BASE_DIR)/data
	chmod 777 $(TC_BASE_DIR)/data

# Build all images of the project or a specified one as dev-images.
# Param: (optional) service - Only build a specified service, e.g. `service=testcenter-backend`
build:
	cd $(TC_BASE_DIR) &&\
	docker compose --progress plain --file docker/docker-compose.yml --file docker/docker-compose.dev.yml build $(service)

# Create and start all application containers.
# Hint: Stop local webserver before, to free port 80
# Param: (optional) service - Only build a specified service, e.g. `service=testcenter-backend`
up:
	cd $(TC_BASE_DIR) &&\
	docker compose --file docker/docker-compose.yml --file docker/docker-compose.dev.yml up --detach $(service)

# Stop and remove all application containers.
down:
	cd $(TC_BASE_DIR) &&\
	docker compose --file docker/docker-compose.yml --file docker/docker-compose.dev.yml down --remove-orphans $(service)

# Start the application with already existing containers.
# Param: (optional) service - Only start a specified service, e.g. `service=testcenter-backend`
start:
	cd $(TC_BASE_DIR) &&\
	docker compose --file docker/docker-compose.yml --file docker/docker-compose.dev.yml start $(service)

# Stop the application but don't remove the service containers.
# Param: (optional) service - Only stop a specified service, e.g. `service=testcenter-backend`
stop:
	cd $(TC_BASE_DIR) &&\
	docker compose --file docker/docker-compose.yml --file docker/docker-compose.dev.yml stop $(service)

# Log the application.
# Param: (optional) service - Only log a specified service, e.g. `service=testcenter-backend`
log:
	cd $(TC_BASE_DIR) &&\
	docker compose --file docker/docker-compose.yml --file docker/docker-compose.dev.yml logs --follow $(service)

# Build all images of the project or a specified one as prod-images.
# Param: (optional) service - Only build a specified service, e.g. `service=testcenter-backend`
build-prod-local:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--progress plain\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
			--file docker/docker-compose.local-prod.yml\
		build $(service)

# Create and start all application containers from locally build production images.
# Hint: Stop local webserver before, to free port 80
# Param: (optional) service - Only build a specified service, e.g. `service=testcenter-backend`
up-prod-local:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--progress plain\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
			--file docker/docker-compose.local-prod.yml\
		up --build --detach $(service)

# Stop and remove all application containers from locally build production images.
# Param: (optional) service - Only stop and remove a specified service, e.g. `service=testcenter-backend`
down-prod-local:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
			--file docker/docker-compose.local-prod.yml\
		down $(service)

# Logs the application with locally build prod-images.
# Param: (optional) service - Only log a specified service, e.g. `service=testcenter-backend`
log-prod-local:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
			--file docker/docker-compose.local-prod.yml\
		logs --follow $(service)
