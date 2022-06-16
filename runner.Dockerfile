FROM node:14.19-buster-slim

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install --only=dev

COPY README.md /app/README.md
COPY broadcasting-service /app/broadcasting-service
COPY definitions /app/definitions
COPY dist-src /app/dist-src
COPY docs /app/docs
COPY frontend /app/frontend
COPY sampledata /app/sampledata
COPY scripts /app/scripts
COPY test /app/test

RUN mkdir /app/tmp

# will be overwritten by makefile
CMD ["sleep", "infinity"]