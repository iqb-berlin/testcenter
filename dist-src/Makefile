run:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --abort-on-container-exit

run-detached:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

stop:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml stop

down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

pull:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

restart:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

logs:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml logs $(service)