# The compose call of the dev stack. Targets that need more (e.g. the api or e2e test stack) add their files after it.
COMPOSE_DEV := docker compose\
		--env-file $(TC_BASE_DIR)/.env.dev\
		--file $(TC_BASE_DIR)/docker-compose.yml\
		--file $(TC_BASE_DIR)/docker-compose.dev.yml
