build-image:
	docker build -t iqbberlin/testcenter-broadcasting-service -f docker/Dockerfile .

push-image:
	docker push iqbberlin/testcenter-broadcasting-service:latest
