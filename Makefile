run:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
run-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop
down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

run-dev-tls:
	docker-compose -f docker-compose.yml -f docker-compose.dev.tls.yml up
run-dev-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.tls.yml up -d

run-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up
run-prod-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.nontls.yml up -d

run-prod-tls:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up
run-prod-tls-detached:
	docker-compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d


build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

init-dev-config:
	cp .env-default .env
	echo 'HOSTNAME=localhost' >> .env
	echo 'MYSQL_ROOT_PASSWORD=secret_root_pw' >> .env
	echo 'MYSQL_DATABASE=iqb_tba_testcenter' >> .env
	echo 'MYSQL_USER=iqb_tba_db_user' >> .env
	echo 'MYSQL_PASSWORD=iqb_tba_db_password' >> .env
	cp testcenter-frontend/src/environments/environment.dev.ts testcenter-frontend/src/environments/environment.ts

update-submodules:
	git submodule update --remote --merge

# Running setup must be stopped because a special env file needs to used
test-e2e:
	cp testcenter-frontend/src/environments/environment.ts testcenter-frontend/src/environments/environment.ts.bu
	cp e2etest/environment.ts testcenter-frontend/src/environments/environment.ts
	make run-detached
	docker build -f e2etest/Dockerfile --tag e2etest .
	sleep 8
	docker run --network "testcenter-setup_default" e2etest
	make down
	cp testcenter-frontend/src/environments/environment.ts.bu testcenter-frontend/src/environments/environment.ts

new-version:
	scripts/new_version.py
