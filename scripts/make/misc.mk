TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

# Copies files from the containers to local. This is useful for development in an IDE environment.
# Container must be run at least once!
sync-package-files:
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-frontend:/usr/src/testcenter/frontend/package.json frontend/package.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-frontend:/usr/src/testcenter/frontend/package-lock.json frontend/package-lock.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-frontend:/usr/src/testcenter/frontend/node_modules frontend/node_modules
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-broadcasting-service:/usr/src/testcenter/broadcasting-service/package.json broadcasting-service/package.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-broadcasting-service:/usr/src/testcenter/broadcasting-service/package-lock.json broadcasting-service/package-lock.json
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-broadcasting-service:/usr/src/testcenter/broadcasting-service/node_modules broadcasting-service/node_modules
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-backend:/var/www/testcenter/backend/vendor backend
	cd $(TC_BASE_DIR) &&\
	docker compose\
			--env-file .env.dev\
			--file docker-compose.yml\
			--file docker-compose.dev.yml\
		cp testcenter-backend:/var/www/testcenter/backend/composer.lock backend/composer.lock

# Use this param to only show issues which can be solved by updating
#--ignore-unfixed
image-scan:
	docker run\
			--rm\
			--volume /var/run/docker.sock:/var/run/docker.sock\
		aquasec/trivy:latest image --security-checks vuln $(image):$(tag)
