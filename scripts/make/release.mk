TC_BASE_DIR := $(shell git rev-parse --show-toplevel)

# prevents collisions of make target names with possible file names
.PHONY: release-prepare release-check

# Sets the version numbers of a release in all files that carry one, then runs release-check.
# Param: VERSION - e.g. 19.2.0-rc1 or 19.2.0
release-prepare:
	$(TC_BASE_DIR)/scripts/release.sh prepare $(VERSION)

# Lists every file whose version number does not match the release.
# Param: VERSION - optional, defaults to the version in package.json
release-check:
	$(TC_BASE_DIR)/scripts/release.sh check $(VERSION)
