TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

# Copies files from the containers to local. This is useful for development in an IDE environment.
# Container must be run at least once!
sync-package-files:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp frontend:/usr/src/testcenter/frontend/package.json frontend/package.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp frontend:/usr/src/testcenter/frontend/package-lock.json frontend/package-lock.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp frontend:/usr/src/testcenter/frontend/node_modules frontend/node_modules
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp broadcaster:/usr/src/testcenter/broadcaster/package.json broadcaster/package.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp broadcaster:/usr/src/testcenter/broadcaster/package-lock.json broadcaster/package-lock.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp broadcaster:/usr/src/testcenter/broadcaster/node_modules broadcaster/node_modules
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp backend:/var/www/testcenter/backend/vendor backend
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp backend:/var/www/testcenter/backend/composer.lock backend/composer.lock
