run:
	docker-compose up
run-detached:
	docker-compose up -d

run-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
run-prod-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

run-prod-tls:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up
run-prod-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d

run-prod-tls-acme:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.acme.yml up
run-prod-tls-acme-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.acme.yml up -d

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
