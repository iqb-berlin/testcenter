// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
// eslint-disable-next-line import/no-extraneous-dependencies
const logToOutput = require('cypress-log-to-output');
const deleteFolder = require('./cypress/plugins/delete-folder');
const waitForServer = require('./cypress/plugins/wait-for-server');

const urls = {
  backend: 'http://testcenter-backend',
  fileService: 'http://testcenter-file-service',
  frontend: 'http://testcenter-frontend:4200',
  broadcastingService: 'http://testcenter-broadcasting-service:3000'
};

module.exports = defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/output.xml'
  },
  requestTimeout: 10000,
  video: true,
  screenshotOnRunFailure: true,
  e2e: {
    setupNodeEvents(on) {
      on('task', { deleteFolder });
      logToOutput.install(on, (type, event) => event.level === 'error' || event.type === 'error');
      on('before:run', async () => {
        await waitForServer(`${urls.backend}/system/config`);
        await waitForServer(`${urls.broadcastingService}/`);
        await waitForServer(`${urls.fileService}/health`);
        await waitForServer(urls.frontend);
      });
    },
    env: {
      urls
    },
    testIsolation: true
  }
});
