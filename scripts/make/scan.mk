TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

# Docker Hub Proxy (Docker Hub: REGISTRY_PATH := )
#REGISTRY_PATH := scm.cms.hu-berlin.de:443/iqb/dependency_proxy/containers/
REGISTRY_PATH :=

TRIVY_VERSION := aquasec/trivy:latest

# prevents collisions of make target names with possible file names
.PHONY: scan-registry-login scan-registry-logout scan-app scan-traefik scan-broadcasting-service scan-frontend\
	scan-file-service scan-backend scan-cache-service scan-db

# disables printing the recipe of a make target before executing it
.SILENT: scan-registry-login scan-registry-logout

# Log in to selected registry
scan-registry-login:
	if test $(REGISTRY_PATH); then printf "Login %s\n" $(REGISTRY_PATH); docker login $(REGISTRY_PATH); fi

# Log out of selected registry
scan-registry-logout:
	if test $(REGISTRY_PATH); then docker logout $(REGISTRY_PATH); fi

# scans application images for security vulnerabilities
scan-app: scan-traefik scan-broadcasting-service scan-frontend scan-file-service scan-backend scan-cache-service scan-db

# scans traefik image for security vulnerabilities
scan-traefik: scan-registry-login
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image\
						--scanners vuln\
						--ignore-unfixed\
						--severity CRITICAL\
					$(REGISTRY_PATH)traefik:v3.4

# scans broadcasting-service image for security vulnerabilities
scan-broadcasting-service: scan-registry-login
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--target=prod\
				--file $(TC_BASE_DIR)/broadcaster/Dockerfile\
				--tag $(REGISTRY_PATH)iqbberlin/testcenter-broadcasting-service:scan\
			.
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
 				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
 			$(TRIVY_VERSION)\
 				image\
 						--scanners vuln\
 						--ignore-unfixed\
 						--severity CRITICAL\
					$(REGISTRY_PATH)iqbberlin/testcenter-broadcasting-service:scan

# scans frontend image for security vulnerabilities
scan-frontend: scan-registry-login
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--target=prod\
				--file $(TC_BASE_DIR)/frontend/Dockerfile\
				--tag $(REGISTRY_PATH)iqbberlin/testcenter-frontend:scan\
			.
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
 				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
 			$(TRIVY_VERSION)\
 				image\
 						--scanners vuln\
 						--ignore-unfixed\
 						--severity CRITICAL\
					$(REGISTRY_PATH)iqbberlin/testcenter-frontend:scan

# scans file-service image for security vulnerabilities
scan-file-service: scan-registry-login
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--file $(TC_BASE_DIR)/file-server/Dockerfile\
				--tag $(REGISTRY_PATH)iqbberlin/testcenter-file-service:scan\
			.
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
 				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
 			$(TRIVY_VERSION)\
 				image\
 						--scanners vuln\
 						--ignore-unfixed\
 						--severity CRITICAL\
					$(REGISTRY_PATH)iqbberlin/testcenter-file-service:scan

# scans backend image for security vulnerabilities
scan-backend: scan-registry-login
	cd $(TC_BASE_DIR) &&\
		docker build\
				--progress plain\
				--pull\
				--target=prod\
				--file $(TC_BASE_DIR)/backend/Dockerfile\
				--tag $(REGISTRY_PATH)iqbberlin/testcenter-backend:scan\
			.
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
 				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
 			$(TRIVY_VERSION)\
 				image\
 						--scanners vuln\
 						--ignore-unfixed\
 						--severity CRITICAL\
					$(REGISTRY_PATH)iqbberlin/testcenter-backend:scan

# scans cache-service image for security vulnerabilities
scan-cache-service: scan-registry-login
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
 				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
 			$(TRIVY_VERSION)\
 				image\
 						--scanners vuln\
 						--ignore-unfixed\
 						--severity CRITICAL\
					$(REGISTRY_PATH)redis:8.0-bookworm

# scans db image for security vulnerabilities
scan-db: scan-registry-login
	cd $(TC_BASE_DIR) &&\
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION) --version
		docker run\
				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
			$(TRIVY_VERSION)\
				image --download-db-only --no-progress
		docker run\
 				--rm\
				--volume /var/run/docker.sock:/var/run/docker.sock\
				--volume $(HOME)/Library/Caches:/root/.cache/\
 			$(TRIVY_VERSION)\
 				image\
 						--scanners vuln\
 						--ignore-unfixed\
 						--severity CRITICAL\
					$(REGISTRY_PATH)mysql:8.4
