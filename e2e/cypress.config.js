const { defineConfig } = require('cypress');
const logToOutput = require('cypress-log-to-output');
const deleteFolder = require('./src/plugins/delete-folder');
const waitForServer = require('./src/plugins/wait-for-server');

// The stack under test, by default the dev stack as this machine reaches it (through Traefik).
// e2e/docker-compose.system-test-headless.yml sets the addresses for a browser inside the Docker network.
const urls = {
  backend: process.env.E2E_BACKEND_URL || 'http://localhost/api',
  fileServer: process.env.E2E_FILE_SERVER_URL || 'http://localhost/fs',
  frontend: process.env.E2E_FRONTEND_URL || 'http://localhost',
  broadcaster: process.env.E2E_BROADCASTER_URL || 'http://localhost/bs'
};
// screenshots, videos, downloads and results
const outputFolder = process.env.E2E_OUTPUT_FOLDER || 'cypress';

module.exports = defineConfig({
  // reporter: 'junit', https://github.com/cypress-io/cypress/issues/4602
  reporterOptions: {
    mochaFile: `${outputFolder}/results/output.xml`
  },
  defaultCommandTimeout: 15000,
  requestTimeout: 45000,
  responseTimeout: 60000,
  e2e: {
    baseUrl: urls.frontend,
    env: {
      urls
    },
    specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'src/support/e2e.ts',
    fixturesFolder: './src/fixtures',
    fileServerFolder: '.',
    downloadsFolder: `./${outputFolder}/downloads`,
    videosFolder: `./${outputFolder}/videos`,
    screenshotsFolder: `./${outputFolder}/screenshots`,
    video: true,
    chromeWebSecurity: false,
    testIsolation: true,
    setupNodeEvents(on) {
      on('task', { deleteFolder });
      // the browser's errors in the terminal
      logToOutput.install(on, (type, event) => event.level === 'error' || event.type === 'error');
      on('before:run', async () => {
        await waitForServer(`${urls.backend}/system/config`);
        await waitForServer(`${urls.broadcaster}/`);
        await waitForServer(`${urls.fileServer}/health`);
        await waitForServer(urls.frontend);
      });
    }
  }
});
