run:
	docker-compose up

run-detached:
	docker-compose up -d

stop:
	docker-compose stop

down:
	docker-compose down

init-config:
	cp .env-default .env
	make -C testcenter-backend init-dev-config
	cd ..
	make -C testcenter-frontend init-prod-docker-config
