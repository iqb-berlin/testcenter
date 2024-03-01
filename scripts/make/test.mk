test-backend-unit:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
	--rm --entrypoint "" \
	testcenter-backend \
		php -dxdebug.mode='debug' /var/www/backend/vendor/phpunit/phpunit/phpunit \
			--bootstrap /var/www/backend/test/unit/bootstrap.php \
			--configuration /var/www/backend/phpunit.xml \
				/var/www/backend/test/unit/. \


test-backend-unit-coverage:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
	--rm --entrypoint "" \
	testcenter-backend \
		php -dxdebug.mode='coverage' /var/www/backend/vendor/phpunit/phpunit/phpunit \
			--bootstrap /var/www/backend/test/unit/bootstrap.php \
			--configuration /var/www/backend/phpunit.xml \
			--coverage-html /docs/dist/test-coverage-backend-unit \
				/var/www/backend/test/unit/. \
			--testdox

# Performs Api-Tests
test-backend-api:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d testcenter-db testcenter-backend testcenter-cache-service
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs
	make run-task-runner task=backend:api-test

# Performs a tests suite from the initialization tests.
# Param test - (All files in backend/test/initialization/tests for are available tests.)
# Example: `make test-backend-initialization test=general/db-versions`
test-backend-initialization:
	TEST_NAME=$(test) \
		docker compose -f docker/docker-compose.initialization-test.yml up --force-recreate --renew-anon-volumes --abort-on-container-exit

# Performs some tests around the initialization script like upgrading the db-schema.
test-backend-initialization-general:
	make stop # TODO this should be able to run while the testcenter runs ins dev-mode
	make test-backend-initialization test=general/db-versions
	make test-backend-initialization test=general/vanilla-installation
	make test-backend-initialization test=general/no-db-but-files
	make test-backend-initialization test=general/install-db-patches
	make test-backend-initialization test=general/re-initialize

test-broadcasting-service-unit:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
		-v $(CURDIR)/broadcasting-service/src:/app/src \
		testcenter-broadcasting-service \
		npx jest

test-broadcasting-service-unit-coverage:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
		-v $(CURDIR)/broadcasting-service/src:/app/src \
		-v $(CURDIR)/docs/dist:/docs/dist \
		testcenter-broadcasting-service \
		npx jest --coverage

test-frontend-unit:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
		-v $(CURDIR)/frontend/src:/app/src \
		testcenter-frontend \
		npx ng test --watch=false

test-frontend-unit-coverage:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
		-v $(CURDIR)/frontend/src:/app/src \
		-v $(CURDIR)/docs/dist:/docs/dist \
		testcenter-frontend \
		npx ng test --watch=false --code-coverage

# Performs some API tests with Dredd on the file-service
# ! Attention: The testcenter must not run when starting this # TODO change this
# TODO this creates a file in /sampledata. Change this.
test-file-service-api:
	make down
	docker compose \
		-f docker/docker-compose.yml \
		-f docker/docker-compose.dev.yml \
		-f docker/docker-compose.api-test.yml \
		up -d testcenter-cache-service testcenter-file-service
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs
	make run-task-runner task=file-service:api-test

# Performs some integration tests with CyPress against mocked backend with Prism
test-frontend-integration:
# TODO implement integration tests with CyPress against mocked backend with Prism

# Performs some e2e tests with CyPress against real backend and services
test-system-headless:
	make down
	docker compose \
		-f docker/docker-compose.yml \
		-f docker/docker-compose.dev.yml \
		-f docker/docker-compose.system-test-headless.yml up \
		--abort-on-container-exit --exit-code-from=testcenter-e2e

test-system:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up &
	bash e2e/run-e2e.sh

