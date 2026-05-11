TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

include $(TC_BASE_DIR)/.env.prod

## prevents collisions of make target names with possible file names
.PHONY: prod-test-registry-login prod-test-registry-logout prod-test-build prod-test-up prod-test-down prod-test-logs \
        _prod-test-build-backend _prod-test-build-frontend _prod-test-build-broadcaster _prod-test-build-file-server _prod-test-build-e2e

## disables printing the recipe of a make target before executing it
.SILENT: prod-test-registry-login prod-test-registry-logout

## Log in to selected registry (see .env.prod file)
prod-test-registry-login:
	if test $(DOCKER_HUB_PROXY); then printf "Login %s\n" $(DOCKER_HUB_PROXY); docker login $(DOCKER_HUB_PROXY); fi

## Log out of selected registry (see .env.prod file)
prod-test-registry-logout:
	if test $(DOCKER_HUB_PROXY); then docker logout $(DOCKER_HUB_PROXY); fi

## Build production and e2e test images
# Param (optional): service - Build only the specified service, e.g. `make prod-test-build service=backend`
#                             Allowed: backend, frontend, broadcaster, file-server, e2e
prod-test-build: prod-test-registry-login
ifeq ($(service),)
	$(MAKE) -f $(TC_BASE_DIR)/scripts/make/prod-test.mk _prod-test-build-backend
	$(MAKE) -f $(TC_BASE_DIR)/scripts/make/prod-test.mk _prod-test-build-frontend
	$(MAKE) -f $(TC_BASE_DIR)/scripts/make/prod-test.mk _prod-test-build-broadcaster
	$(MAKE) -f $(TC_BASE_DIR)/scripts/make/prod-test.mk _prod-test-build-file-server
	$(MAKE) -f $(TC_BASE_DIR)/scripts/make/prod-test.mk _prod-test-build-e2e
else
	$(MAKE) -f $(TC_BASE_DIR)/scripts/make/prod-test.mk _prod-test-build-$(service)
endif

_prod-test-build-backend:
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=${DOCKER_HUB_PROXY}\
				--file $(TC_BASE_DIR)/backend/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-backend:e2e\
			.

_prod-test-build-frontend:
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/frontend/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-frontend:e2e\
			.

_prod-test-build-broadcaster:
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/broadcaster/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-broadcaster:e2e\
			.

_prod-test-build-file-server:
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--build-arg REGISTRY_PATH=$(DOCKER_HUB_PROXY)\
				--file $(TC_BASE_DIR)/file-server/Dockerfile\
				--tag $(DOCKER_HUB_PROXY)iqbberlin/testcenter-file-server:e2e\
			.

_prod-test-build-e2e:
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
			--file $(TC_BASE_DIR)/docker-compose.prod.tls.yml\
		up --no-build --pull never -d

## Stop and remove production containers
prod-test-down:
	docker compose\
			--env-file $(TC_BASE_DIR)/.env.prod\
			--file $(TC_BASE_DIR)/docker-compose.yml\
			--file $(TC_BASE_DIR)/docker-compose.prod.tls.yml\
		down
	sed -i.sed 's/^VERSION=e2e$$/VERSION=stable/' $(TC_BASE_DIR)/.env.prod &&\
		rm $(TC_BASE_DIR)/.env.prod.sed

## Show service logs
# Param (optional): SERVICE - Show log of the specified service only, e.g. `make prod-test-logs SERVICE=db`
prod-test-logs:
	docker compose\
			--env-file $(TC_BASE_DIR)/.env.prod\
			--file $(TC_BASE_DIR)/docker-compose.yml\
			--file $(TC_BASE_DIR)/docker-compose.prod.tls.yml\
		logs -f $(service)
