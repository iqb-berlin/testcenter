# Performs a single task on the whole project using the task-runner
# Param: task - For available tasks see scripts in see /package.json # TODO make clear wich ones are for task runner and which ones are for local usage
run-task-runner:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
		--rm --no-deps \
		testcenter-task-runner npm run $(task)

# Copies files from the containers to local. This is useful for development in an IDE environment.
# Container must be run at least once!
sync-package-files:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-frontend:/app/package.json frontend/package.json
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-frontend:/app/package-lock.json frontend/package-lock.json
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-frontend:/app/node_modules frontend/node_modules
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-broadcasting-service:/app/package.json broadcasting-service/package.json
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-broadcasting-service:/app/package-lock.json broadcasting-service/package-lock.json
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-broadcasting-service:/app/node_modules broadcasting-service/node_modules
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-backend:/var/www/backend/vendor backend
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml cp testcenter-backend:/var/www/backend/composer.lock backend/composer.lock

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
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run --name=testcenter-task-runner \
		testcenter-task-runner npx --yes update-browserslist-db@latest && npm run create-interfaces
	# can not  use compose here https://github.com/docker/compose/issues/8467
	docker cp testcenter-task-runner:/app/package.json ./package.json
	docker cp testcenter-task-runner:/app/package-lock.json ./package-lock.json

composer-install:
	docker build -f docker/backend.Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run \
		-v $(CURDIR)/backend/composer.json:/var/www/backend/composer.json \
		-v $(CURDIR)/backend/composer.lock:/var/www/backend/composer.lock \
		-v $(CURDIR)/backend/vendor:/var/www/backend/vendor \
		-v $(CURDIR)/backend/src:/var/www/backend/src \
		testcenter-backend-composer \
		composer install --no-interaction --no-ansi

composer-update:
	docker build -f docker/backend.Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run \
		-v $(CURDIR)/backend/composer.json:/var/www/backend/composer.json \
		-v $(CURDIR)/backend/composer.lock:/var/www/backend/composer.lock \
		-v $(CURDIR)/backend/vendor:/var/www/backend/vendor \
		-v $(CURDIR)/backend/src:/var/www/backend/src \
		testcenter-backend-composer \
		composer update --no-interaction --no-ansi --working-dir=/var/www/backend

# use this whenever you created or renamed a class in backend to refresh the autoloader.
backend-refresh-autoload:
	docker build -f docker/backend.Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run \
		-v $(CURDIR)/backend/composer.json:/var/www/backend/composer.json \
		-v $(CURDIR)/backend/composer.lock:/var/www/backend/composer.lock \
		-v $(CURDIR)/backend/vendor:/var/www/backend/vendor \
		-v $(CURDIR)/backend/src:/var/www/backend/src \
		-v $(CURDIR)/backend/test:/var/www/backend/test \
		testcenter-backend-composer \
		composer dump-autoload --working-dir=/var/www/backend
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build testcenter-backend

new-version:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
 		--rm --entrypoint="" \
 		testcenter-backend \
 		php /var/www/backend/test/update-sql-scheme.php
	make run-task-runner task="new-version $(version)"

# Re-runs the initialization script of the backend to apply new database patches and re-read the data-dir.
re-init-backend:
	docker exec -it testcenter-backend php /var/www/backend/initialize.php

# Use this param to only show issues which can be solved by updating
#--ignore-unfixed
image-scan:
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image \
    --security-checks vuln $(image):$(tag)
