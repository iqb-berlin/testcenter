TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

include $(TC_BASE_DIR)/.env.prod

## prevents collisions of make target names with possible file names
.PHONY: prod-test-registry-login prod-test-registry-logout prod-test-build prod-test-up prod-test-down prod-test-logs

## disables printing the recipe of a make target before executing it
.SILENT: prod-test-registry-login prod-test-registry-logout

## Log in to selected registry (see .env.prod file)
prod-test-registry-login:
	if test $(DOCKER_HUB_PROXY); then printf "Login %s\n" $(DOCKER_HUB_PROXY); docker login $(DOCKER_HUB_PROXY); fi

## Log out of selected registry (see .env.prod file)
prod-test-registry-logout:
	if test $(DOCKER_HUB_PROXY); then docker logout $(DOCKER_HUB_PROXY); fi

## Build production and e2e test images
prod-test-build: prod-test-registry-login
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=${DOCKER_HUB_PROXY}\
				--file $(TC_BASE_DIR)/backend/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-backend:e2e\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/frontend/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-frontend:e2e\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/broadcasting-service/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-broadcasting-service:e2e\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/file-server/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-file-service:e2e\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/e2e/Dockerfile\
				--tag testcenter-e2e\
			.
## Start production containers
prod-test-up:
	sed -i.sed 's/^VERSION=.*$$/VERSION=e2e/' $(TC_BASE_DIR)/.env.prod &&\
		rm $(TC_BASE_DIR)/.env.prod.sed
	docker compose\
			--env-file $(TC_BASE_DIR)/.env.prod\
			--file $(TC_BASE_DIR)/docker-compose.yml\
			--file $(TC_BASE_DIR)/docker-compose.prod.yml\
		up --no-build --pull never -d

## Stop and remove production containers
prod-test-down:
	docker compose\
			--env-file $(TC_BASE_DIR)/.env.prod\
			--file $(TC_BASE_DIR)/docker-compose.yml\
			--file $(TC_BASE_DIR)/docker-compose.prod.yml\
		down
	sed -i.sed 's/^VERSION=e2e$$/VERSION=stable/' $(TC_BASE_DIR)/.env.prod &&\
		rm $(TC_BASE_DIR)/.env.prod.sed

## Show service logs
# Param (optional): SERVICE - Show log of the specified service only, e.g. `make prod-test-logs SERVICE=db`
prod-test-logs:
	docker compose\
			--env-file $(TC_BASE_DIR)/.env.prod\
			--file $(TC_BASE_DIR)/docker-compose.yml\
			--file $(TC_BASE_DIR)/docker-compose.prod.yml\
		logs -f $(SERVICE)
