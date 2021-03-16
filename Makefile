run:
	cd docker && docker-compose up

run-detached:
	cd docker && docker-compose up -d

stop:
	cd docker && docker-compose stop

down:
	cd docker && docker-compose down

build:
	cd docker && docker-compose build

test-unit:
	cd docker && docker-compose exec testcenter-backend vendor/bin/phpunit unit-tests/.

test-e2e:
	cd docker && docker-compose exec testcenter-backend npm --prefix=integration run dredd_test

test-e2e-no-spec-update:
	cd docker && docker-compose exec testcenter-backend npm --prefix=integration run dredd_test_no_specs

update-docs:
	cd docker && docker-compose exec testcenter-backend npm --prefix=integration run update_specs

tag-major:
	scripts/new_version.py major

tag-minor:
	scripts/new_version.py minor

tag-patch:
	scripts/new_version.py patch
