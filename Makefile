init:
	make init-env
	make init-frontend
	make init-ensure-file-rights
	make download-simple-player
	make composer-install

build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build $(service)

run:
#	make build container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up $(service)

run-detached:
	make build container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d $(service)

build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml build $(service)

run-prod:
	build-prod container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml up $(service)

run-prod-detached:
	build-prod container=$(service)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml up -d $(service)

stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop $(service)

down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans $(service)

run-task-runner:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run \
		--rm --no-deps \
		testcenter-task-runner npm run $(task)

test-backend-unit:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run \
		--rm --no-deps --entrypoint "" \
		testcenter-backend \
		php -dxdebug.mode=coverage vendor/phpunit/phpunit/phpunit \
		--bootstrap test/unit/bootstrap.php \
		--configuration phpunit.xml \
		--coverage-html /docs/dist/test-coverage-backend-unit \
		test/unit/.

# TODO backend and db must be running
test-backend-dredd:
	make run-task-runner task=backend:dredd-test

test-backend-dredd-mysql:
	docker-compose -f docker-compose.initialization-test.yml --profile=dredd_test_against_mysql build
	TESTMODE_REAL_DATA=yes TEST_NAME=plus/installation-and-e2e \
		docker-compose -f docker-compose.initialization-test.yml --profile=dredd_test_against_mysql up \
		--force-recreate --renew-anon-volumes --abort-on-container-exit

test-backend-initialization:
	TEST_NAME=$(test) \
		docker-compose -f docker-compose.initialization-test.yml up --force-recreate --renew-anon-volumes --abort-on-container-exit

test-backend-initialization-general:
	make stop
	docker-compose -f docker-compose.initialization-test.yml build
	make test-backend-initialization test=general/db-versions
	make test-backend-initialization test=general/vanilla-installation
	make test-backend-initialization test=general/no-db-but-files
	make test-backend-initialization test=general/install-db-patches

test-broadcasting-service-unit:
	make build service=testcenter-broadcasting-service
	docker run \
		-v $(CURDIR)/docs/dist:/docs/dist \
		--entrypoint npx \
		iqbberlin/testcenter-broadcasting-service:current \
		jest --coverage

test-frontend-unit:
	make build service=testcenter-frontend
	docker run \
		-v $(CURDIR)/docs/dist:/docs/dist \
		--entrypoint npx \
		iqbberlin/testcenter-frontend:current \
		ng test --watch=false --code-coverage

test-frontend-integration:
#TODO


test-system:
	CURRENT_UID=$(shell id -u):$(shell id -g) \
		docker-compose -f docker-compose.system-test.yml up --abort-on-container-exit


# --force-recreate --renew-anon-volumes


test-system-headless:

run-browser:
	docker run \
	  --network=host \
      --user=`id -u ${USER}` \
      -e DISPLAY=${DISPLAY} \
		scm.cms.hu-berlin.de:4567/iqb/iqb-browsertest-container/iqb-browsertest-container \
		google-chrome --no-sandbox

# =$(shell hostname -I | awk '{print $$1}'):0
#			  --network=host \
#      -v /dev:/dev \
#      -p 8080:80 \
#      -v `echo ~`:/home/${USER} \
#      --volume="/etc/group:/etc/group:ro" \
#      --volume="/etc/passwd:/etc/passwd:ro" \
#      --volume="/etc/shadow:/etc/shadow:ro" \
#      --volume="/etc/sudoers.d:/etc/sudoers.d:ro" \
#      --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" \

#npm run integration-test # TODO do in container
#npm npx --workspace=frontend cypress run --env=TC_URL=http://localhost --browser firefox --headless

update-docs:
#TODO
	make docs-frontend-compodoc
	make docs-broadcasting-service-compodoc
	make docs-frontend-compodoc
	make docs-api-specs
	make docs-user

docs-frontend-compodoc:
	make run-task-runner task=frontend:update-compodoc

docs-broadcasting-service-compodoc:
	make run-task-runner task=broadcasting-service:update-compodoc

docs-api-specs:
	make run-task-runner task=backend:update-specs

docs-user:
	make run-task-runner task=create-docs

create-interfaces:
	make run-task-runner task=create-interfaces


#copy-packages:
#	mkdir -p node_modules
#	docker cp testcenter-frontend-dev:/app/node_modules/. node_modules

# Use parameter packages=<package-name> to install new package
# Otherwise it installs the packages defined in package.json
# Example: make install-package packages="leftpad babel"
#install-packages:
#	docker exec testcenter-frontend-dev npm install $(packages)



init-env:
	cp dist-src/.env .env

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

init-ensure-file-rights:
	chmod -R 0444 database/my.cnf # mysql does not accept it otherwise

new-version:
	make run-task-runner task="new-version $(version)"


