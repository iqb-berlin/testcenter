TC_BASE_DIR := $(shell git rev-parse --show-toplevel)
TAG := dev
CHART_VERSION := $(shell helm show chart $(TC_BASE_DIR)/scripts/helm/testcenter | grep -E "^version:" | awk '{print $$2}')

# prevents collisions of make target names with possible file names
.PHONY: push-dockerhub push-iqb-registry push-helm-chart

# Build and tag all docker images
.build:
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--no-cache\
				--rm\
				--target=prod\
				--file $(TC_BASE_DIR)/backend/Dockerfile\
				--tag iqbberlin/testcenter-backend:$(TAG)\
				--tag scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-backend:$(TAG)\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--no-cache\
				--rm\
				--file $(TC_BASE_DIR)/file-server/Dockerfile\
				--tag iqbberlin/testcenter-file-server:$(TAG)\
				--tag scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-file-server:$(TAG)\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--no-cache\
				--rm\
				--target=prod\
				--file $(TC_BASE_DIR)/frontend/Dockerfile\
				--tag iqbberlin/testcenter-frontend:$(TAG)\
				--tag scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-frontend:$(TAG)\
			.
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--no-cache\
				--rm\
				--target=prod\
				--file $(TC_BASE_DIR)/broadcaster/Dockerfile\
				--tag iqbberlin/testcenter-broadcaster:$(TAG)\
				--tag scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-broadcaster:$(TAG)\
			.

# Push all docker images to 'hub.docker.com'
push-dockerhub: .build
	docker login
	docker push iqbberlin/testcenter-backend:$(TAG)
	docker push iqbberlin/testcenter-file-server:$(TAG)
	docker push iqbberlin/testcenter-frontend:$(TAG)
	docker push iqbberlin/testcenter-broadcaster:$(TAG)
	docker logout

# Push all docker images to 'scm.cms.hu-berlin.de:4567/iqb/testcenter'
push-iqb-registry: .build
	docker login scm.cms.hu-berlin.de:4567
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-backend:$(TAG)
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-file-server:$(TAG)
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-frontend:$(TAG)
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-broadcaster:$(TAG)
	docker logout

push-helm-chart:
	cd $(TC_BASE_DIR)/scripts/helm &&\
	sed -i.bak "s|^appVersion:.*|appVersion: $(TAG)|" testcenter/Chart.yaml && rm testcenter/Chart.yaml.bak &&\
	helm package testcenter &&\
	helm push testcenter-$(CHART_VERSION).tgz oci://registry-1.docker.io/iqbberlin &&\
	rm testcenter-$(CHART_VERSION).tgz
