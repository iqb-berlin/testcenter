# Performs a single task on the whole project using the task-runner
# Param: task - For available tasks see scripts in see /package.json # TODO make clear wich ones are for task runner and which ones are for local usage
run-task-runner:
	docker compose\
 			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		run --rm --no-deps testcenter-task-runner\
			npm run $(task)

# Copies files from the containers to local. This is useful for development in an IDE environment.
# Container must be run at least once!
sync-package-files:
	docker compose\
 			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-frontend:/usr/src/testcenter/frontend/package.json frontend/package.json
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-frontend:/usr/src/testcenter/frontend/package-lock.json frontend/package-lock.json
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-frontend:/usr/src/testcenter/frontend/node_modules frontend/node_modules
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-broadcasting-service:/usr/src/testcenter/broadcasting-service/package.json broadcasting-service/package.json
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-broadcasting-service:/usr/src/testcenter/broadcasting-service/package-lock.json broadcasting-service/package-lock.json
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-broadcasting-service:/usr/src/testcenter/broadcasting-service/node_modules broadcasting-service/node_modules
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-backend:/var/www/testcenter/backend/vendor backend
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		cp testcenter-backend:/var/www/testcenter/backend/composer.lock backend/composer.lock

update-docs:
	make docs-frontend-compodoc
	make docs-broadcasting-service-compodoc
	make docs-api-specs
	make docs-user

docs-frontend-compodoc:
	make run-task-runner task=frontend:update-compodoc

docs-broadcasting-service-compodoc:
	make run-task-runner task=broadcasting-service:update-compodoc

# Creates a documentation (with ReDoc) of the the API between frontend and backend
docs-api-specs:
	make run-task-runner task=backend:update-specs

# Creates some documentation-files about custom-texts, booklet-configurations and other out of the definitions.
docs-user:
	make run-task-runner task=create-docs

# Creates some interfaces for booklets and test-modes out of the definitions.
create-interfaces:
	docker container rm -f testcenter-task-runner 2> /dev/null || true
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
		run --name=testcenter-task-runner testcenter-task-runner\
			npx --yes update-browserslist-db@latest && npm run create-interfaces
	# can not  use compose here https://github.com/docker/compose/issues/8467
	docker cp testcenter-task-runner:/usr/src/testcenter/task-runner/package.json ./package.json
	docker cp testcenter-task-runner:/usr/src/testcenter/task-runner/package-lock.json ./package-lock.json

composer-install:
	docker run --rm --interactive --tty\
			--volume $(CURDIR)/backend/composer.json:/usr/src/testcenter/backend/composer.json\
			--volume $(CURDIR)/backend/composer.lock:/usr/src/testcenter/backend/composer.lock\
			--volume $(CURDIR)/backend/src:/usr/src/testcenter/backend/src\
			--volume $(CURDIR)/backend/test:/usr/src/testcenter/backend/test\
			--volume $(CURDIR)/backend/vendor:/usr/src/testcenter/backend/vendor\
			--volume $(HOME)/.composer:/tmp/cache\
		composer:lts install\
				--no-interaction\
				--ignore-platform-reqs\
				--no-ansi\
				--working-dir=/usr/src/testcenter/backend
	make build service=testcenter-backend

composer-update:
	docker run --rm --interactive --tty\
			--volume $(CURDIR)/backend/composer.json:/usr/src/testcenter/backend/composer.json\
			--volume $(CURDIR)/backend/composer.lock:/usr/src/testcenter/backend/composer.lock\
			--volume $(CURDIR)/backend/src:/usr/src/testcenter/backend/src\
			--volume $(CURDIR)/backend/test:/usr/src/testcenter/backend/test\
			--volume $(CURDIR)/backend/vendor:/usr/src/testcenter/backend/vendor\
			--volume $(HOME)/.composer:/tmp/cache\
		composer:lts update\
				--no-interaction\
				--ignore-platform-reqs\
				--no-ansi\
				--working-dir=/usr/src/testcenter/backend
	make build service=testcenter-backend

# use this whenever you created or renamed a class in backend to refresh the autoloader.
composer-refresh-autoload:
	docker run --rm --interactive --tty\
			--volume $(CURDIR)/backend/composer.json:/usr/src/testcenter/backend/composer.json:ro\
			--volume $(CURDIR)/backend/composer.lock:/usr/src/testcenter/backend/composer.lock:ro\
			--volume $(CURDIR)/backend/src:/usr/src/testcenter/backend/src:ro\
			--volume $(CURDIR)/backend/test:/usr/src/testcenter/backend/test:ro\
			--volume $(CURDIR)/backend/vendor:/usr/src/testcenter/backend/vendor\
			--volume $(HOME)/.composer:/tmp/cache\
		composer:lts dump-autoload --working-dir=/usr/src/testcenter/backend
	make build service=testcenter-backend
	make run service=testcenter-backend

new-version:
	docker compose\
			--env-file docker/.env.dev\
			--file docker/docker-compose.yml\
			--file docker/docker-compose.dev.yml\
 		run --rm --entrypoint="" testcenter-backend\
    	php /var/www/testcenter/backend/test/update-sql-scheme.php
	make run-task-runner task="new-version $(version)"

# Re-runs the initialization script of the backend to apply new database patches and re-read the data-dir.
re-init-backend:
	docker exec -it testcenter-backend php /var/www/testcenter/backend/initialize.php

# Use this param to only show issues which can be solved by updating
#--ignore-unfixed
image-scan:
	docker run\
			--rm\
			--volume /var/run/docker.sock:/var/run/docker.sock\
		aquasec/trivy:latest image --security-checks vuln $(image):$(tag)
