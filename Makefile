init:
	make init-env
	make init-frontend
	make download-simple-player
	make composer-install

build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build $(service)

run:
	make build container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up $(service)

run-detached:
	make build container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d $(service)

build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml build $(service)

run-prod:
	make build-prod container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml up $(service)

run-prod-detached:
	make build-prod container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml up -d $(service)

stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop $(service)

down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down $(service)


test-backend-unit:
	make build service=testcenter-backend
	docker run --entrypoint vendor/phpunit/phpunit/phpunit \
		iqbberlin/testcenter-backend:current --bootstrap unit-tests/bootstrap.php --configuration phpunit.xml unit-tests/.

test-backend-dredd:
	make run-detached
	docker build -f runner.Dockerfile -t testcenter-task-runner .
	docker run --network testcenter --entrypoint npm testcenter-task-runner run backend:dredd-test

test-backend-dredd-mysql:
#TODO
#	TEST_NAME=plus/installation-and-e2e make test-init

test-frontend-unit:
	make build service=testcenter-frontend
	docker run --entrypoint npx iqbberlin/testcenter-frontend:current ng test --watch=false --code-coverage

test-backend-init:
#TODO
#docker-compose -f docker/docker-compose-init-test.yml up --force-recreate --abort-on-container-exit --renew-anon-volumes

test-backend-init-general:
#TODO
#	TEST_NAME=general/db-versions make test-init
#	TEST_NAME=general/vanilla-installation make test-init
#	TEST_NAME=general/no-db-but-files make test-init
#	TEST_NAME=general/install-db-patches make test-init

test-frontend-e2e:
#TODO


test-broadcasting-service-unit:
	#TODO
#	make build service=testcenter-broadcasting-service
#	docker run --entrypoint npx iqbberlin/testcenter-frontend:current -w broadcasting-service jest


test-integration:
#TODO

update-docs:
#TODO
#	docker-compose -f docker/docker-compose.yml --env-file docker/.env exec -T testcenter-backend npm --prefix=integration run update_specs


#init-dev-config:
#	cp src/environments/environment.dev.ts src/environments/environment.ts
#
#copy-packages:
#	mkdir -p node_modules
#	docker cp testcenter-frontend-dev:/app/node_modules/. node_modules

# Use parameter packages=<package-name> to install new package
# Otherwise it installs the packages defined in package.json
# Example: make install-package packages="leftpad babel"
#install-packages:
#	docker exec testcenter-frontend-dev npm install $(packages)


#
#run-prod-tls:
#	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up
#run-prod-tls-detached:
#	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d

init-env:
	cp .env-default .env

download-simple-player:
	wget https://raw.githubusercontent.com/iqb-berlin/verona-player-simple/main/verona-player-simple-4.0.0.html -O sampledata/verona-player-simple-4.0.0.html
	wget https://raw.githubusercontent.com/iqb-berlin/verona-player-simple/main/sample-data/introduction-unit.htm -O sampledata/introduction-unit.htm

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

#

## Running setup must be stopped because a special env file needs to used
#test-e2e:
#	cp testcenter-frontend/src/environments/environment.ts testcenter-frontend/src/environments/environment.ts.bu
#	cp e2etest/environment.ts testcenter-frontend/src/environments/environment.ts
#	make run-detached
#	docker build -f e2etest/Dockerfile --tag e2etest .
#	sleep 8
#	docker run --network "testcenter-setup_default" e2etest
#	make down
#	mv testcenter-frontend/src/environments/environment.ts.bu testcenter-frontend/src/environments/environment.ts
#

new-version:
# TODO
#	scripts/new_version.py
