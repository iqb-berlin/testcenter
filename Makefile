run:
	docker-compose up

run-prod:
	docker-compose -f docker-compose-prod.yml up

run-detached-prod:
	docker-compose -f docker-compose-prod.yml up -d

stop:
	docker-compose stop

down:
	docker-compose down

init-config:
	cp .env-default .env

init-dev-config: init-config
	make -C testcenter-frontend init-dev-config
