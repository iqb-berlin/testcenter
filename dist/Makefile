run-prod-nontls:
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up
run-prod-nontls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up -d

run-prod-tls:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up
run-prod-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d

stop:
	docker-compose stop

init-config:
	cp .env-default .env
