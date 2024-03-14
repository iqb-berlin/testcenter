include .env

run:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		echo "Starting with TLS";\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml up --abort-on-container-exit;\
	else\
		echo "Starting without TLS";\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml up --abort-on-container-exit;\
	fi

run-detached:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml up -d;\
	else\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d;\
	fi

stop:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml stop;\
	else\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml stop;\
	fi

down:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml down;\
	else\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml down;\
	fi

pull:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml pull;\
	else\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml pull;\
	fi

restart:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml restart;\
	else\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml restart;\
	fi

logs:
	@if [ "$(TLS_ENABLED)" = "on" ] || [ "$(TLS_ENABLED)" = "yes" ] || [ "$(TLS_ENABLED)" = "true" ]; then\
		docker compose -f docker-compose.yml -f docker-compose.prod.tls.yml logs $(service);\
	else\
		docker compose -f docker-compose.yml -f docker-compose.prod.yml logs $(service);\
	fi
