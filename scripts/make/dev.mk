TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

## prevents collisions of make target names with possible file names
.PHONY: init build up down start stop logs composer-install composer-update composer-refresh-autoload re-init-backend\
	create-interfaces update-docs docs-frontend-compodoc docs-broadcasting-service-compodoc docs-api-specs docs-user\
	new-version

# Initialized the Application. Run this right after checking out the Repo.
init:
	cp $(TC_BASE_DIR)/.env.dev-template $(TC_BASE_DIR)/.env.dev
	cp $(TC_BASE_DIR)/.env.prod-template $(TC_BASE_DIR)/.env.prod
	cp $(TC_BASE_DIR)/frontend/src/environments/environment.dev.ts $(TC_BASE_DIR)/frontend/src/environments/environment.ts
	chmod 0755 $(TC_BASE_DIR)/scripts/database/000-create-test-db.sh
	mkdir -m 777 -p $(TC_BASE_DIR)/docs/dist
	mkdir -m 777 -p $(TC_BASE_DIR)/data

# Build all images of the project or a specified one as dev-images.
# Param: (optional) service - Only build a specified service, e.g. `service=testcenter-backend`
build:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--progress plain\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		build $(service)

# Ramp the application up (i.e. creates and starts all application containers).
# Hint: Stop local webserver before, to free port 80
# Param: (optional) service - Only ramp up a specified service, e.g. `service=testcenter-backend`
up:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		up --detach $(service)

# Stop and remove all application containers.
down:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		down --remove-orphans $(service)

# Start the application with already existing containers.
# Param: (optional) service - Only start a specified service, e.g. `service=testcenter-backend`
start:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		start $(service)

# Stop the application but don't remove the service containers.
# Param: (optional) service - Only stop a specified service, e.g. `service=testcenter-backend`
stop:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		stop $(service)

# Log the application.
# Param: (optional) service - Only log a specified service, e.g. `service=testcenter-backend`
logs:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		logs --follow $(service)

composer-install:
	docker run --rm --interactive --tty\
			--volume $(TC_BASE_DIR)/backend/composer.json:/usr/src/testcenter/backend/composer.json\
			--volume $(TC_BASE_DIR)/backend/composer.lock:/usr/src/testcenter/backend/composer.lock\
			--volume $(TC_BASE_DIR)/backend/src:/usr/src/testcenter/backend/src\
			--volume $(TC_BASE_DIR)/backend/test:/usr/src/testcenter/backend/test\
			--volume $(TC_BASE_DIR)/backend/vendor:/usr/src/testcenter/backend/vendor\
			--volume $(HOME)/.composer:/tmp/cache\
		composer:lts install\
				--no-interaction\
				--ignore-platform-reqs\
				--no-ansi\
				--working-dir=/usr/src/testcenter/backend
	cd $(TC_BASE_DIR) && make build service=testcenter-backend

composer-update:
	docker run --rm --interactive --tty\
			--volume $(TC_BASE_DIR)/backend/composer.json:/usr/src/testcenter/backend/composer.json\
			--volume $(TC_BASE_DIR)/backend/composer.lock:/usr/src/testcenter/backend/composer.lock\
			--volume $(TC_BASE_DIR)/backend/src:/usr/src/testcenter/backend/src\
			--volume $(TC_BASE_DIR)/backend/test:/usr/src/testcenter/backend/test\
			--volume $(TC_BASE_DIR)/backend/vendor:/usr/src/testcenter/backend/vendor\
			--volume $(HOME)/.composer:/tmp/cache\
		composer:lts update\
				--no-interaction\
				--ignore-platform-reqs\
				--no-ansi\
				--working-dir=/usr/src/testcenter/backend
	cd $(TC_BASE_DIR) && make build service=testcenter-backend

# use this whenever you created or renamed a class in backend to refresh the autoloader.
composer-refresh-autoload:
	docker run --rm --interactive --tty\
			--volume $(TC_BASE_DIR)/backend/composer.json:/usr/src/testcenter/backend/composer.json:ro\
			--volume $(TC_BASE_DIR)/backend/composer.lock:/usr/src/testcenter/backend/composer.lock:ro\
			--volume $(TC_BASE_DIR)/backend/src:/usr/src/testcenter/backend/src:ro\
			--volume $(TC_BASE_DIR)/backend/test:/usr/src/testcenter/backend/test:ro\
			--volume $(TC_BASE_DIR)/backend/vendor:/usr/src/testcenter/backend/vendor\
			--volume $(HOME)/.composer:/tmp/cache\
		composer:lts dump-autoload --working-dir=/usr/src/testcenter/backend
	cd $(TC_BASE_DIR) && make build service=testcenter-backend
	cd $(TC_BASE_DIR) && make up service=testcenter-backend

# Re-runs the initialization script of the backend to apply new database patches and re-read the data-dir.
re-init-backend:
	docker exec -it testcenter-backend php /var/www/testcenter/backend/initialize.php

# Creates some interfaces for booklets and test-modes out of the definitions.
create-interfaces:
	cd $(TC_BASE_DIR) &&\
	docker container rm -f testcenter-task-runner 2> /dev/null || true &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file test/docker-compose.api-test.yml\
		run --name=testcenter-task-runner testcenter-task-runner\
			npx --yes update-browserslist-db@latest && npm run create-interfaces

update-docs:
	cd $(TC_BASE_DIR) &&\
	make docs-frontend-compodoc &&\
	make docs-broadcasting-service-compodoc &&\
	make docs-api-specs &&\
	make docs-user

# Performs a single task on the whole project using the task-runner
# Param: task - For available tasks see scripts in see /package.json # TODO make clear wich ones are for task runner and which ones are for local usage
.run-task-runner:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file test/docker-compose.api-test.yml\
		run --rm --no-deps testcenter-task-runner\
			npm run $(task)

docs-frontend-compodoc:
	cd $(TC_BASE_DIR) && make .run-task-runner task=frontend:update-compodoc

docs-broadcasting-service-compodoc:
	cd $(TC_BASE_DIR) && make .run-task-runner task=broadcasting-service:update-compodoc

# Creates a documentation (with ReDoc) of the the API between frontend and backend
docs-api-specs:
	cd $(TC_BASE_DIR) && make .run-task-runner task=backend:update-specs

# Creates some documentation-files about custom-texts, booklet-configurations and other out of the definitions.
docs-user:
	cd $(TC_BASE_DIR) && make .run-task-runner task=create-docs

new-version:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		run --rm --entrypoint="" testcenter-backend\
			php /var/www/testcenter/backend/test/update-sql-scheme.php &&\
	make .run-task-runner task="new-version $(version)"
