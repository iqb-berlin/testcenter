/* eslint-disable no-console */
const http = require('http');

module.exports = async function waitForBackend(apiUrl) {
  const getStatus = () => new Promise(resolve => {
    const request = http.get(
      `${apiUrl}/system/config`,
      response => {
        response.on('data', () => resolve(response.statusCode));
      }
    );
    request.on('error', () => resolve(-1));
  });
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  let retries = 10;
  let status = 0;
  // eslint-disable-next-line no-plusplus
  while ((status !== 200) && retries--) {
    // eslint-disable-next-line no-await-in-loop
    status = await getStatus();
    if (status === 200) {
      return true;
    }
    console.log(`Connection attempt to Backend failed; ${retries} retries left`);
    // eslint-disable-next-line no-await-in-loop
    await sleep(5000);
  }
  throw new Error(`Could not reach Backend: ${apiUrl}`);
};
