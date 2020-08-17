FROM node:13.14.0

ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app

COPY package.json /app/package.json
RUN npm install

COPY . /app

EXPOSE 3000

CMD npm run start
