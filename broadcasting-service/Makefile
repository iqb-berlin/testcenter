run:
	docker-compose -f docker/docker-compose.yml up

run-detached:
	docker-compose -f docker/docker-compose.yml up -d

stop:
	docker-compose -f docker/docker-compose.yml stop

down:
	docker-compose -f docker/docker-compose.yml down

build:
	docker-compose -f docker/docker-compose.yml build

test-unit:
	docker-compose -f docker/docker-compose.yml exec -T testcenter-broadcasting-service-dev npm test

tag-major:
	scripts/new_version.py major

tag-minor:
	scripts/new_version.py minor

tag-patch:
	scripts/new_version.py patch
