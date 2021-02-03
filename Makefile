run-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
run-dev-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

run-dev-tls:
	docker-compose -f docker-compose.yml -f docker-compose.dev.tls.yml up
run-dev-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.tls.yml up -d

stop:
	docker-compose stop

build:
	docker-compose build

init-config:
	cp .env-default .env

init-dev-config: init-config
	make -C testcenter-frontend init-dev-config

update-submodules:
	git submodule update --remote --merge

make test-e2e: run-prod-detached
	docker build -f e2etest/Dockerfile --tag e2etest .
	docker run --network host e2etest
	docker-compose stop

make new-version:
	scripts/new_version.py
