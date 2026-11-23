# The compose call of the dev stack. Targets that need more (e.g. the api or e2e test stack) add their files after it.
COMPOSE_DEV := docker compose\
		--env-file $(TC_BASE_DIR)/.env.dev\
		--file $(TC_BASE_DIR)/docker-compose.yml\
		--file $(TC_BASE_DIR)/docker-compose.dev.yml

# LOCAL_S3 comes from .env.dev or the command line (`make up LOCAL_S3=true`)
ifeq ($(LOCAL_S3),true)
COMPOSE_DEV += --file $(TC_BASE_DIR)/docker-compose.s3.yml
endif
