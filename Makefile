run:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env up

run-detached:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env up -d

stop:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env stop

down:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env down

build:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env build

# TODO does not wait for server to start and fails
# test: run-detached test-unit test-e2e stop

test-unit:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec testcenter-backend vendor/bin/phpunit unit-tests/.

test-e2e:
	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec testcenter-backend npm --prefix=integration run dredd_test

init-dev-config:
	cp docker/.env-default docker/.env

build-image:
	docker build -t iqbberlin/testcenter-backend -f docker/Dockerfile .

push-image:
	docker push iqbberlin/testcenter-backend:latest
