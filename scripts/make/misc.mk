# Performs a single task on the whole project using the task-runner
# Param: task - For available tasks see scripts in see /package.json # TODO make clear wich ones are for task runner and which ones are for local usage
run-task-runner:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run \
		--rm --no-deps \
		testcenter-task-runner npm run $(task)

# Container must be run at least once!
sync-npm-files:
	docker-compose cp testcenter-frontend:/app/package.json frontend/package.json
	docker-compose cp testcenter-frontend:/app/package-lock.json frontend/package-lock.json
	docker-compose cp testcenter-frontend:/app/node_modules frontend/node_modules
	docker-compose cp testcenter-broadcasting-service:/app/package.json broadcasting-service/package.json
	docker-compose cp testcenter-broadcasting-service:/app/package-lock.json broadcasting-service/package-lock.json
	docker-compose cp testcenter-broadcasting-service:/app/node_modules broadcasting-service/node_modules

# Updates all automatic generated documentation files.
update-docs:
	make docs-frontend-compodoc
	make docs-broadcasting-service-compodoc
	make docs-frontend-compodoc
	make docs-api-specs
	make docs-user


# Creates code documentation (with Compodoc) of the frontend.
docs-frontend-compodoc:
	make run-task-runner task=frontend:update-compodoc

# Creates code documentation (with Compodoc) of the broadcasting-service.
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
	make run-task-runner task=create-interfaces

init-env:
	cp docker/.env-default docker/.env

composer-install: # TODO 13 - is this necessary? or automatically done with building the container
	docker build -f backend/Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run \
		-v $(CURDIR)/backend/composer.json:/composer.json \
		-v $(CURDIR)/backend/composer.lock:/composer.lock \
		-v $(CURDIR)/backend/vendor:/vendor \
		testcenter-backend-composer \
		composer install --no-interaction --no-ansi

composer-update:
	docker build -f backend/Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run \
		-v $(CURDIR)/backend/composer.json:/composer.json \
		-v $(CURDIR)/backend/composer.lock:/composer.lock \
		-v $(CURDIR)/backend/vendor:/vendor \
		testcenter-backend-composer \
		composer update --no-interaction --no-ansi

init-frontend:
	cp frontend/src/environments/environment.dev.ts frontend/src/environments/environment.ts

init-ensure-file-rights:
	chmod -R 0444 scripts/database/my.cnf # mysql does not accept it otherwise

new-version:
	make run-task-runner task="new-version $(version)"

fix-docker-user:
	$(shell sed -i 's/user_id_placeholder/$(shell id -u)/g' docker/.env)
	$(shell sed -i 's/user_group_placeholder/$(shell id -g)/g' docker/.env)

# Re-runs the initialization script of the backend to apply new database patches and re-read the data-dir.
re-init-backend:
	docker exec -it testcenter-backend php /var/www/html/inititailze.php