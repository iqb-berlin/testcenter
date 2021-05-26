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
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend vendor/bin/phpunit unit-tests/.

test-e2e:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run dredd_test

test-e2e-no-spec-update:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run dredd_test_no_specs

test-init:
	TEST_NAME=db-versions docker-compose -f docker/docker-compose-init-test.yml up --force-recreate --abort-on-container-exit --renew-anon-volumes
	TEST_NAME=vanilla-installation docker-compose -f docker/docker-compose-init-test.yml up --force-recreate --abort-on-container-exit --renew-anon-volumes
	TEST_NAME=no-db-but-files docker-compose -f docker/docker-compose-init-test.yml up --force-recreate --abort-on-container-exit --renew-anon-volumes
	TEST_NAME=install-db-patches docker-compose -f docker/docker-compose-init-test.yml up --force-recreate --abort-on-container-exit --renew-anon-volumes

update-docs:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run update_specs

init-dev-config:
	cp docker/.env-default docker/.env

tag-major:
	scripts/new_version.py major

tag-minor:
	scripts/new_version.py minor

tag-patch:
	scripts/new_version.py patch

composer-install:
	docker build -f docker/Dockerfile --target backend-composer -t testcenter-backend-composer:latest . &&\
	 docker run -v ${PWD}/composer.json:/composer.json -v ${PWD}/composer.lock:/composer.lock -v ${PWD}/vendor:/vendor testcenter-backend-composer composer install --no-interaction --no-ansi

composer-update:
	docker build -f docker/Dockerfile --target backend-composer -t testcenter-backend-composer:latest . &&\
	 docker run -v ${PWD}/auth.json:/auth.json  -v ${PWD}/composer.json:/composer.json -v ${PWD}/composer.lock:/composer.lock -v ${PWD}/vendor:/vendor testcenter-backend-composer composer update --no-interaction --no-ansi
