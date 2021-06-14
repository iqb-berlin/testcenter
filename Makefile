run:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
run-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop
down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

run-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
run-prod-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

run-prod-tls:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up
run-prod-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d

build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

composer-install:
	cd testcenter-backend/ && docker build -f docker/Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run -v ${PWD}/testcenter-backend/composer.json:/composer.json -v ${PWD}/testcenter-backend/composer.lock:/composer.lock -v ${PWD}/testcenter-backend/vendor:/vendor testcenter-backend-composer composer install --no-interaction --no-ansi

composer-update:
	cd testcenter-backend/ && docker build -f docker/Dockerfile --target backend-composer -t testcenter-backend-composer:latest .
	docker run -v ${PWD}/testcenter-backend/auth.json:/auth.json  -v ${PWD}/testcenter-backend/composer.json:/composer.json -v ${PWD}/testcenter-backend/composer.lock:/composer.lock -v ${PWD}/testcenter-backend/vendor:/vendor testcenter-backend-composer composer update --no-interaction --no-ansi

init-dev-config: composer-install
	cp .env-default .env
	cp testcenter-frontend/src/environments/environment.dev.ts testcenter-frontend/src/environments/environment.ts

update-submodules:
	git submodule update --remote --merge

# Running setup must be stopped because a special env file needs to used
test-e2e:
	cp testcenter-frontend/src/environments/environment.ts testcenter-frontend/src/environments/environment.ts.bu
	cp e2etest/environment.ts testcenter-frontend/src/environments/environment.ts
	make run-detached
	docker build -f e2etest/Dockerfile --tag e2etest .
	sleep 8
	docker run --network "testcenter-setup_default" e2etest
	make down
	cp testcenter-frontend/src/environments/environment.ts.bu testcenter-frontend/src/environments/environment.ts

new-version:
	scripts/new_version.py
