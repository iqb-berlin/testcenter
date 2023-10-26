// see https://www.mattknight.io/blog/docker-healthchecks-in-distroless-node-js
const http = require('node:http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

http
  .request(options, res => {
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.log(`Error response: ${res.statusCode} (${res.statusMessage})`);
        process.exit(1);
      }
      process.exit(0);
    });
  })
  .on('error', err => {
    console.log('Error: ', err);
    process.exit(1);
  })
  .end();
