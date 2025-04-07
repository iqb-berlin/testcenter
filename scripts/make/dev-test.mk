TC_BASE_DIR := $(shell git rev-parse --show-toplevel)
target ?= .

test-backend-unit:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		run --rm --entrypoint "" testcenter-backend\
			php -dxdebug.mode='debug' /var/www/testcenter/backend/vendor/phpunit/phpunit/phpunit\
						--bootstrap /var/www/testcenter/backend/test/unit/bootstrap.php\
						--configuration /var/www/testcenter/backend/phpunit.xml\
					/var/www/testcenter/backend/test/unit/$(target)

test-backend-unit-coverage:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		run --rm --entrypoint "" testcenter-backend\
			php -dxdebug.mode='coverage' /var/www/testcenter/backend/vendor/phpunit/phpunit/phpunit\
					--bootstrap /var/www/testcenter/backend/test/unit/bootstrap.php\
					--configuration /var/www/testcenter/backend/phpunit.xml\
					--coverage-html /docs/dist/test-coverage-backend-unit\
				/var/www/testcenter/backend/test/unit/${target} --testdox

test-backend-api:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
			--file test/docker-compose.api-test.yml\
		run --rm testcenter-task-runner-backend\
			node_modules/.bin/gulp --gulpfile=./test/api/test.js runDreddTest

# Performs a tests suite from the initialization tests.
# Param test - (All files in backend/test/initialization/tests for are available tests.)
# Example: `make test-backend-initialization test=general/db-versions`
test-backend-initialization:
	cd $(TC_BASE_DIR) &&\
	TEST_NAME=$(test) \
	docker compose\
			--env-file .env.dev\
			--file backend/test/initialization/docker-compose.initialization-test.yml\
		up\
			--force-recreate\
			--renew-anon-volumes\
			--abort-on-container-exit\
			--exit-code-from=testcenter-initialization-test-backend

# Performs some tests around the initialization script like upgrading the db-schema.
test-backend-initialization-general:
	cd $(TC_BASE_DIR) && make stop # TODO this should be able to run while the testcenter runs ins dev-mode
	cd $(TC_BASE_DIR) && make test-backend-initialization test=general/db-versions
	cd $(TC_BASE_DIR) && make test-backend-initialization test=general/vanilla-installation
	cd $(TC_BASE_DIR) && make test-backend-initialization test=general/no-db-but-files
	cd $(TC_BASE_DIR) && make test-backend-initialization test=general/install-db-patches
	cd $(TC_BASE_DIR) && make test-backend-initialization test=general/re-initialize

test-broadcasting-service-unit:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml run\
		testcenter-broadcasting-service\
			npx jest

test-broadcasting-service-unit-coverage:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml run\
		testcenter-broadcasting-service\
			npx jest --coverage

test-frontend-unit:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml run\
		testcenter-frontend\
			npx ng test --watch=false

test-frontend-unit-coverage:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml run\
		testcenter-frontend\
			npx ng test --watch=false --code-coverage

# Performs some integration tests with CyPress against mocked backend with Prism
test-frontend-integration:
# TODO implement integration tests with CyPress against mocked backend with Prism

# Performs some API tests with Dredd on the file-service
# ! Attention: The testcenter must not run when starting this # TODO change this
# TODO this creates a file in /sampledata. Change this.
test-file-service-api:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
			--file test/docker-compose.api-test.yml\
		run --rm testcenter-task-runner-file-service\
			npm run file-service:api-test

# Performs some e2e tests with CyPress against real backend and services
# Param: (optional) spec - specific spec to run (example: spec=Test-Controller/hot-return), omit parameter for all.
test-system-headless:
	-cd $(TC_BASE_DIR) &&\
	make down &&\
	SPEC=$(spec) \
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
			--file e2e/docker-compose.system-test-headless.yml\
		up\
			--abort-on-container-exit\
			--exit-code-from=testcenter-e2e
	@cd $(TC_BASE_DIR) &&\
	docker compose --progress quiet\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
			--file e2e/docker-compose.system-test-headless.yml\
		down &&\
	docker image rm testcenter-testcenter-e2e

test-system:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		up -d &&\
	bash e2e/run-e2e.sh
	@cd $(TC_BASE_DIR) &&\
	docker compose --progress quiet\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		down
