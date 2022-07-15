run:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

run-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

stop:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml stop

down:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

pull:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

logs:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs $(service)