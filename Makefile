run:
	docker-compose up

run-detached:
	docker-compose up

run-prod:
	docker-compose -f docker-compose-prod.yml up

run-prod-detached:
	docker-compose -f docker-compose-prod.yml up -d

stop:
	docker-compose stop

down:
	docker-compose down

init-config:
	cp .env-default .env

init-dev-config: init-config
	make -C testcenter-frontend init-dev-config
