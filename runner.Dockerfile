ARG NODE_VERSION=14.15.0

FROM node:${NODE_VERSION}

WORKDIR /app
COPY package.json .
RUN npm install

COPY broadcasting-service /app/broadcasting-service
COPY frontend /app/frontend
COPY sampledata /app/sampledata
COPY scripts /app/scripts
COPY test /app/test
COPY docs /app/docs

RUN mkdir /app/tmp

# will be overwritten by makefile
CMD ["sleep", "infinity"]
