// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
const deleteFolder = require('./src/plugins/delete-folder');
const waitForServer = require('./src/plugins/wait-for-server');

const urls = {
  backend: 'http://localhost/api',
  fileService: 'http://localhost/fs',
  frontend: 'http://localhost',
  broadcastingService: 'http://localhost/bs'
};

const cypressJsonConfig = {
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  video: true,
  videosFolder: './cypress/videos',
  screenshotsFolder: './cypress/screenshots',
  chromeWebSecurity: false,
  specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
  supportFile: 'src/support/e2e.ts'
};

module.exports = defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/output.xml'
  },
  e2e: {
    ...cypressJsonConfig,
    baseUrl: 'http://localhost',
    env: {
      urls
    },
    setupNodeEvents(on) {
      on('task', { deleteFolder });
      on('before:run', async () => {
        await waitForServer(`${urls.backend}/system/config`);
        await waitForServer(urls.frontend);
        await waitForServer(`${urls.fileService}/health`);
        await waitForServer(`${urls.broadcastingService}/`);
      });
    },
    testIsolation: true
  }
});
