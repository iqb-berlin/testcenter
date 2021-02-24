run:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
run-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

run-dev-tls:
	docker-compose -f docker-compose.yml -f docker-compose.dev.tls.yml up
run-dev-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.tls.yml up -d

run-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up
run-prod-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up -d

stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop

build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

pull:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml pull

update-submodules:
	git submodule update --remote --merge

make test-e2e: run-prod-detached
	docker build -f e2etest/Dockerfile --tag e2etest .
	docker run --network host e2etest
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml stop

make new-version:
	scripts/new_version.py
