run:
	cd docker && docker-compose up

run-detached:
	cd docker && docker-compose up -d

stop:
	cd docker && docker-compose stop

down:
	cd docker && docker-compose down

build:
	cd docker && docker-compose build

test-unit:
	docker run --entrypoint vendor/phpunit/phpunit/phpunit docker_testcenter-backend --bootstrap /var/www/html/unit-tests/bootstrap.php --configuration /var/www/html/phpunit.xml unit-tests/.

test-e2e:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run dredd_test

test-e2e-no-spec-update:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run dredd_test_no_specs

test-init-all-general:
	TEST_NAME=general/db-versions make test-init
	TEST_NAME=general/vanilla-installation make test-init
	TEST_NAME=general/no-db-but-files make test-init
	TEST_NAME=general/install-db-patches make test-init

test-e2e-against-mysql:
	TEST_NAME=plus/installation-and-e2e make test-init

test-init:
	docker-compose -f docker/docker-compose-init-test.yml up --force-recreate --abort-on-container-exit --renew-anon-volumes

update-docs:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run update_specs

init-dev-config: composer-install
	cp docker/.env-default docker/.env

tag-major:
	scripts/new_version.py major

tag-minor:
	scripts/new_version.py minor

tag-patch:
	scripts/new_version.py patch

composer-install:
	docker build -f docker/Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run -v ${PWD}/composer.json:/composer.json -v ${PWD}/composer.lock:/composer.lock -v ${PWD}/vendor:/vendor testcenter-backend-composer composer install --no-interaction --no-ansi

composer-update:
	docker build -f docker/Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run -v ${PWD}/auth.json:/auth.json  -v ${PWD}/composer.json:/composer.json -v ${PWD}/composer.lock:/composer.lock -v ${PWD}/vendor:/vendor testcenter-backend-composer composer update --no-interaction --no-ansi
