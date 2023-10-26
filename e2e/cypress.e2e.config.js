// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
const logToOutput = require('cypress-log-to-output');
const deleteFolder = require('./cypress/plugins/delete-folder');

const backendURL = 'http://testcenter-backend';
const fileServiceURL = 'http://testcenter-file-service';

module.exports = defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/output.xml'
  },
  requestTimeout: 10000,
  e2e: {
    setupNodeEvents(on) {
      on('task', { deleteFolder });
      logToOutput.install(on);
    },
    env: {
      TC_API_URL: backendURL,
      TC_FILE_SERVICE_URL: fileServiceURL
    },
    testIsolation: true
  }
});

// Keeping the old configuration here for futire reference, in case something does not work as expected.
// Also in case the coverage report is to be re-enabled.

// const { defineConfig } = require('cypress');
// const downloadFile = require('cypress-downloadfile/lib/addPlugin');
// const registerCodeCoverageTasks = require('@cypress/code-coverage/task');
// const deleteFolder = require('./cypress/plugins/delete-folder');
// const waitForBackend = require('./cypress/plugins/wait-for-backend');
// const createCodeCoverageReport = require('./cypress/plugins/create-coverage-report');
//
// const tcApiURL = 'http://testcenter-system-test-backend';
//
// module.exports = defineConfig({
//   e2e: {
//     trashAssetsBeforeRuns: true,
//     baseUrl: 'http://localhost:4200',
//     video: false,
//     screenshotOnRunFailure: false,
//     setupNodeEvents(on, config) {
//       on('task', { downloadFile });
//       on('task', { deleteFolder });
//       if (config.env.TC_TESTMODE === 'cli') {
//         on('after:run', createCodeCoverageReport);
//         registerCodeCoverageTasks(on, config);
//       }
//       on('before:run', () => waitForBackend(tcApiURL));
//       return config;
//     },
//     env: {
//       TC_API_URL: tcApiURL
//     }
//   }
// });
