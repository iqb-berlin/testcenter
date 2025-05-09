TC_BASE_DIR := $(shell git rev-parse --show-toplevel)
TAG := dev

# prevents collisions of make target names with possible file names
.PHONY: push-dockerhub push-iqb-registry

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
				--file $(TC_BASE_DIR)/file-service/Dockerfile\
				--tag iqbberlin/testcenter-file-service:$(TAG)\
				--tag scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-file-service:$(TAG)\
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
				--file $(TC_BASE_DIR)/broadcasting-service/Dockerfile\
				--tag iqbberlin/testcenter-broadcasting-service:$(TAG)\
				--tag scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-broadcasting-service:$(TAG)\
			.

# Push all docker images to 'hub.docker.com'
push-dockerhub: .build
	docker login
	docker push iqbberlin/testcenter-backend:$(TAG)
	docker push iqbberlin/testcenter-file-service:$(TAG)
	docker push iqbberlin/testcenter-frontend:$(TAG)
	docker push iqbberlin/testcenter-broadcasting-service:$(TAG)
	docker logout

# Push all docker images to 'scm.cms.hu-berlin.de:4567/iqb/testcenter'
push-iqb-registry: .build
	docker login scm.cms.hu-berlin.de:4567
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-backend:$(TAG)
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-file-service:$(TAG)
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-frontend:$(TAG)
	docker push scm.cms.hu-berlin.de:4567/iqb/testcenter/iqbberlin/testcenter-broadcasting-service:$(TAG)
	docker logout
