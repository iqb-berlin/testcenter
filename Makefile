run:
	docker-compose -f docker/docker-compose.yml up

run-detached:
	docker-compose -f docker/docker-compose.yml up -d

stop:
	docker-compose -f docker/docker-compose.yml stop

down:
	docker-compose -f docker/docker-compose.yml down

# TODO does not wait for server to start and fails
# test: run-detached test-unit test-e2e stop

test-unit:
	docker-compose -f docker/docker-compose.yml exec testcenter-backend vendor/bin/phpunit unit-tests/.

test-e2e:
	docker-compose -f docker/docker-compose.yml exec testcenter-backend npm --prefix=integration run dredd_test
