// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');
const deleteFolder = require('./cypress/plugins/delete-folder');

module.exports = defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/output.xml'
  },
  e2e: {
    setupNodeEvents(on) {
      on('task', { deleteFolder });
    },
    baseUrl: 'http://localhost',
    env: {
      TC_API_URL: 'http://localhost/api',
      TC_FILE_SERVICE_URL: 'http://localhost/fs'
    },
    testIsolation: true
  }
});
