// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
// eslint-disable-next-line import/no-extraneous-dependencies
const logToOutput = require('cypress-log-to-output');
const deleteFolder = require('./src/plugins/delete-folder');
const waitForServer = require('./src/plugins/wait-for-server');

const urls = {
  backend: 'http://testcenter-backend',
  fileService: 'http://testcenter-file-service',
  frontend: 'http://testcenter-frontend:4200',
  broadcastingService: 'http://testcenter-broadcasting-service:3000'
};

const cypressJsonConfig = {
  downloadsFolder: './cypress-headless/downloads',
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  video: true,
  videosFolder: './cypress-headless/videos',
  screenshotsFolder: './cypress-headless/screenshots',
  chromeWebSecurity: false,
  specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
  supportFile: 'src/support/e2e.ts'
};

module.exports = defineConfig({
  // reporter: 'junit', https://github.com/cypress-io/cypress/issues/4602
  reporterOptions: {
    mochaFile: 'cypress-headless/results/output.xml'
  },
  requestTimeout: 10000,
  video: true,
  screenshotOnRunFailure: true,
  e2e: {
    ...cypressJsonConfig,
    env: {
      urls
    },
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
    testIsolation: true
  }
});
