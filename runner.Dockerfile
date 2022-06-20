FROM node:14.19-buster-slim

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install --only=dev

COPY README.md /app/README.md
COPY broadcasting-service /app/broadcasting-service
COPY definitions /app/definitions
COPY docker-compose.yml /app/docker-compose.yml
COPY dist-src /app/dist-src
COPY docs /app/docs
COPY frontend /app/frontend
COPY sampledata /app/sampledata
COPY scripts /app/scripts
COPY test /app/test

RUN mkdir /app/tmp

# will be overwritten by makefile TODO weg?
CMD ["sleep", "infinity"]