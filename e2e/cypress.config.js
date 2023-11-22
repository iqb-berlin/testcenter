// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
const deleteFolder = require('./cypress/plugins/delete-folder');
const waitForServer = require('./cypress/plugins/wait-for-server');

const urls = {
  backend: 'http://localhost/api',
  fileService: 'http://localhost/fs',
  frontend: 'http://localhost',
  broadcastingService: 'http://localhost/bs'
};

module.exports = defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/output.xml'
  },
  e2e: {
    setupNodeEvents(on) {
      on('task', { deleteFolder });
      on('before:run', async () => {
        await waitForServer(`${urls.backend}/system/config`);
        await waitForServer(urls.frontend);
        await waitForServer(`${urls.fileService}/health`);
        await waitForServer(`${urls.broadcastingService}/`);
      });
    },
    baseUrl: 'http://localhost',
    env: {
      urls
    },
    testIsolation: true
  }
});
