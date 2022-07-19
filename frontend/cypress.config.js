/* eslint-disable import/no-extraneous-dependencies */
const { defineConfig } = require('cypress');
const downloadFile = require('cypress-downloadfile/lib/addPlugin');
const registerCodeCoverageTasks = require('@cypress/code-coverage/task');
const deleteFolder = require('./cypress/plugins/delete-folder');
const createCodeCoverageReport = require('./cypress/plugins/create-coverage-report');

module.exports = defineConfig({
  e2e: {
    trashAssetsBeforeRuns: true,
    baseUrl: 'http://localhost:4200',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      on('task', { downloadFile });
      on('task', { deleteFolder });
      if (!config.isInteractive) {
        on('after:run', createCodeCoverageReport);
        registerCodeCoverageTasks(on, config);
      }
      return config;
    },
    env: {
      TC_API_URL: 'http://testcenter-system-test-backend'
    }
  }
});
