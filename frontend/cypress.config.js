/* eslint-disable import/no-extraneous-dependencies */
const { defineConfig } = require('cypress');
const downloadFile = require('cypress-downloadfile/lib/addPlugin');
const registerCodeCoverageTasks = require('@cypress/code-coverage/task');
const deleteFolder = require('./cypress/plugins/delete-folder');
const waitForBackend = require('./cypress/plugins/wait-for-backend');
const createCodeCoverageReport = require('./cypress/plugins/create-coverage-report');

const tcApiURL = 'http://testcenter-system-test-backend';

module.exports = defineConfig({
  e2e: {
    trashAssetsBeforeRuns: true,
    baseUrl: 'http://localhost:4200',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      on('task', { downloadFile });
      on('task', { deleteFolder });
      if (config.env.TC_TESTMODE === 'cli') {
        on('after:run', createCodeCoverageReport);
        registerCodeCoverageTasks(on, config);
      }
      on('before:run', () => waitForBackend(tcApiURL));
      return config;
    },
    env: {
      TC_API_URL: tcApiURL
    }
  }
});
