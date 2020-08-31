build-image:
	docker build --target prod -t iqbberlin/testcenter-broadcasting-service -f docker/Dockerfile .

push-image:
	docker push iqbberlin/testcenter-broadcasting-service:latest
