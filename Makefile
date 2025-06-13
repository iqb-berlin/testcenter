TESTCENTER_BASE_DIR := $(shell git rev-parse --show-toplevel)
MK_FILE_DIR := $(TESTCENTER_BASE_DIR)/scripts/make

init:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
build:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
up:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
down:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
start:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
stop:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
logs:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
composer-install:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
composer-update:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
composer-refresh-autoload:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
re-init-backend:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
connect-db:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@

create-interfaces:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
update-docs:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
.run-task-runner:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
docs-frontend-compodoc:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
docs-broadcasting-service-compodoc:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
docs-api-specs:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
docs-user:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
create-pages:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
serve-pages:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
new-version:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@

data-pull:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@
data-push:
	$(MAKE) -f $(MK_FILE_DIR)/dev.mk -C $(MK_FILE_DIR) $@

push-dockerhub:
	$(MAKE) -f $(MK_FILE_DIR)/push.mk -C $(MK_FILE_DIR) $@
push-iqb-registry:
	$(MAKE) -f $(MK_FILE_DIR)/push.mk -C $(MK_FILE_DIR) $@
push-helm-chart:
	$(MAKE) -f $(MK_FILE_DIR)/push.mk -C $(MK_FILE_DIR) $@

test-backend-unit:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-backend-unit-coverage:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-backend-api:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-backend-initialization:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-backend-initialization-general:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-broadcasting-service-unit:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-broadcasting-service-unit-coverage:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-frontend-unit:	
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-frontend-unit-coverage:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-frontend-integration:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-file-service-api:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-system-headless:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@
test-system:
	$(MAKE) -f $(MK_FILE_DIR)/dev-test.mk -C $(MK_FILE_DIR) $@

sync-package-files:
	$(MAKE) -f $(MK_FILE_DIR)/misc.mk -C $(MK_FILE_DIR) $@
image-scan:
	$(MAKE) -f $(MK_FILE_DIR)/misc.mk -C $(MK_FILE_DIR) $@
	
testcenter-up:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-up-fg:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-down:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-start:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-stop:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-restart:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-status:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-logs:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-config:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-system-prune:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-volumes-prune:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-images-clean:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-connect-db:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-dump-all:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-restore-all:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-dump-db:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-restore-db:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-dump-db-data-only:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-restore-db-data-only:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-export-backend-vol:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-import-backend-vol:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
testcenter-update:
	$(MAKE) -f $(MK_FILE_DIR)/prod.mk -C $(MK_FILE_DIR) $@
	
prod-test-registry-login:
	$(MAKE) -f $(MK_FILE_DIR)/prod-test.mk -C $(MK_FILE_DIR) $@
prod-test-registry-logout:
	$(MAKE) -f $(MK_FILE_DIR)/prod-test.mk -C $(MK_FILE_DIR) $@
prod-test-build:
	$(MAKE) -f $(MK_FILE_DIR)/prod-test.mk -C $(MK_FILE_DIR) $@
prod-test-up:
	$(MAKE) -f $(MK_FILE_DIR)/prod-test.mk -C $(MK_FILE_DIR) $@
prod-test-down:
	$(MAKE) -f $(MK_FILE_DIR)/prod-test.mk -C $(MK_FILE_DIR) $@
prod-test-logs:
	$(MAKE) -f $(MK_FILE_DIR)/prod-test.mk -C $(MK_FILE_DIR) $@

-include testcenter-scripts/makefile-plus.mk
