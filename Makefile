# Initialized the Application. Run this right after checking out the Repo.
init:
	make init-env
	make init-frontend
	make init-ensure-file-rights
	#make composer-install
	make fix-docker-user

# Build all images of the project or a specified one as dev-images.
# Param: (optional) service - Only build a specified service, eg `service=testcenter-backend`
build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build $(service)

# Starts the application.
# Hint: Stop local webserver before, to free port 80
# Param: (optional) service - Only build a specified service, eg `service=testcenter-backend`
run:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up $(service)

# Build all images of the project or a specified one as prod-images.
# Param: (optional) service - Only build a specified service, eg `service=testcenter-backend`
build-prod-local:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml build $(service)

# Starts the application with locally build prod-images.
# Hint: Stop local webserver before, to free port 80
# Param: (optional) service - Only build a specified service, eg `service=testcenter-backend`
run-prod-local:
	make build-prod-local container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up $(service)

# Stops the application.
stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop $(service)


# Stops the application. Deletes all containers.
down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans $(service)


# Performs a single task on the whole project using the task-runner
# Param: task - For available tasks see scripts in see /package.json # TODO make clear wich ones are for task runner and which ones are for local usage
run-task-runner:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run \
		--rm --no-deps \
		testcenter-task-runner npm run $(task)

sync-npm-files:
	docker cp testcenter-broadcasting-service:/app/package.json broadcasting-service/package.json
	docker cp testcenter-broadcasting-service:/app/package-lock.json broadcasting-service/package-lock.json
	docker cp testcenter-broadcasting-service:/app/node_modules broadcasting-service/node_modules

# Performs unit tests of the backend (with PHPUnit) and creates code-coverage-report
test-backend-unit:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run \
		--rm --no-deps --entrypoint "" \
		testcenter-backend \
		php -dxdebug.mode=coverage vendor/phpunit/phpunit/phpunit \
		--bootstrap test/unit/bootstrap.php \
		--configuration phpunit.xml \
		--coverage-html /docs/dist/test-coverage-backend-unit \
		test/unit/.


# Performs Api-Tests against in-memory DB (sqlite, for performance)
test-backend-api:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d testcenter-db testcenter-backend
	make run-task-runner task=backend:dredd-test


# Performs Api-Tests against MySql (takes a long time, run manually when needed)
test-backend-api-mysql:
	make stop # TODO this should be able to run while the testcenter runs ins dev-mode
	TESTMODE_REAL_DATA=yes TEST_NAME=plus/installation-and-e2e \
		docker-compose -f docker-compose.initialization-test.yml --profile=dredd_test_against_mysql up \
		--force-recreate --renew-anon-volumes --abort-on-container-exit


# Performs a tests suite from the initialization tests.
# Param test - (All files in backend/test/initialization/tests for are available tests.)
# Example: `make test-backend-initialization test=general/db-versions`
test-backend-initialization:
	TEST_NAME=$(test) \
		docker-compose -f docker-compose.initialization-test.yml up --force-recreate --renew-anon-volumes --abort-on-container-exit


# Performs some tests around the initialization script like upgrading the db-schema.
test-backend-initialization-general:
	make stop # TODO this should be able to run while the testcenter runs ins dev-mode
	make test-backend-initialization test=general/db-versions
	make test-backend-initialization test=general/vanilla-installation
	make test-backend-initialization test=general/no-db-but-files
	make test-backend-initialization test=general/install-db-patches


# Performs unit tests with Jest for the backend. Creates a code-coverage report.
test-broadcasting-service-unit:
	docker run \
		-v $(CURDIR)/docs/dist:/docs/dist \
		--entrypoint npx \
		iqbberlin/testcenter-broadcasting-service:current \
		jest --coverage


# Performs unit tests with Karma for the frontend. Creates a code-coverage report.
test-frontend-unit:
	docker run \
		-v $(CURDIR)/docs/dist:/docs/dist \
		--entrypoint npx \
		iqbberlin/testcenter-frontend:current \
		ng test --watch=false --code-coverage


# Performs some integration tests with CyPress against mocked backend with Prism
test-frontend-integration:
# TODO implement integration tests with CyPress against mocked backend with Prism


# Performs some integration tests with CyPress against real MySql-DB and real backend in interactive mode.
test-system:
	make stop # TODO this should be able to run while the testcenter runs ins dev-mode
	docker-compose -f docker-compose.system-test.yml -f docker-compose.system-test-ui.yml up \
		--abort-on-container-exit \
		--force-recreate \
		--renew-anon-volumes


# Performs some e2e tests with CyPress against real MySql-DB and real backend on CLI. Creates a code coverage report for the frontend.
test-system-headless:
	make stop # TODO this should be able to run while the testcenter runs ins dev-mode
	docker-compose -f docker-compose.system-test.yml up \
		--abort-on-container-exit \
		--force-recreate \
		--renew-anon-volumes


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
	cp .env-default .env

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
	chmod -R 0444 database/my.cnf # mysql does not accept it otherwise

new-version:
	make run-task-runner task="new-version $(version)"

fix-docker-user:
	$(shell sed -i 's/user_id_placeholder/$(shell id -u)/g' .env)
	$(shell sed -i 's/user_group_placeholder/$(shell id -g)/g' .env)

# Re-runs the initialization script of the backend to apply new database patches and re-read the data-dir.
re-init-backend:
	docker exec -it testcenter-backend php /var/www/html/inititailze.php