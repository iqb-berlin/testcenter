TC_BASE_DIR := $(shell git rev-parse --show-toplevel)
TAG := dev

# prevents collisions of make target names with possible file names
.PHONY: push-helm-chart push-helm-chart-production

push-helm-chart:
	docker run --rm\
		--volume $(TC_BASE_DIR)/scripts/helm:/work\
		--volume $(HOME)/.docker:/root/.docker:ro\
		--workdir /work\
		--entrypoint sh\
		alpine/helm:3\
		-c 'sed -i "s|^appVersion:.*|appVersion: $(TAG)|" testcenter/Chart.yaml &&\
			CHART_VERSION=$$(helm show chart testcenter | awk "/^version:/ {print \$$2}") &&\
			helm package testcenter &&\
			helm push testcenter-$${CHART_VERSION}.tgz oci://registry-1.docker.io/iqbberlin &&\
			rm testcenter-$${CHART_VERSION}.tgz'

push-helm-chart-production:
	docker run --rm\
		--volume $(TC_BASE_DIR)/scripts/helm:/work\
		--volume $(HOME)/.docker:/root/.docker:ro\
		--workdir /work\
		--entrypoint sh\
		alpine/helm:3\
		-c 'CHART_VERSION=$$(helm show chart testcenter | awk "/^version:/ {print \$$2}") &&\
			helm package testcenter &&\
			helm push testcenter-$${CHART_VERSION}.tgz oci://registry-1.docker.io/iqbberlin &&\
			rm testcenter-$${CHART_VERSION}.tgz'
