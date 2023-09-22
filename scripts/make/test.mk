test-backend-unit:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
	--rm --entrypoint "" \
	testcenter-backend \
		php -dxdebug.mode='debug' /var/www/backend/vendor/phpunit/phpunit/phpunit \
			--bootstrap /var/www/backend/test/unit/bootstrap.php \
			--configuration /var/www/backend/phpunit.xml \
				/var/www/backend/test/unit/.

test-backend-unit-coverage:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run \
	--rm --entrypoint "" \
	testcenter-backend \
		php -dxdebug.mode='coverage' /var/www/backend/vendor/phpunit/phpunit/phpunit \
			--bootstrap /var/www/backend/test/unit/bootstrap.php \
			--configuration /var/www/backend/phpunit.xml \
			--coverage-html /docs/dist/test-coverage-backend-unit \
				/var/www/backend/test/unit/.

# Performs Api-Tests
test-backend-api:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d testcenter-db testcenter-backend
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

# Performs some integration tests with CyPress against mocked backend with Prism
test-frontend-integration:
# TODO implement integration tests with CyPress against mocked backend with Prism

# Performs some e2e tests with CyPress against real MySql-DB and real backend on CLI.
test-system-headless:
		docker compose -f docker/docker-compose.system-test-headless.yml up \
			--abort-on-container-exit \
			--force-recreate \
			--renew-anon-volumes

test-system:
		docker compose -f docker/docker-compose.system-test-ui.yml up \
			--abort-on-container-exit \
			--force-recreate \
			--renew-anon-volumes
