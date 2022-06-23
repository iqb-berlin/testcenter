/* eslint-disable import/no-extraneous-dependencies */
const { defineConfig } = require('cypress');
const { downloadFile } = require('cypress-downloadfile/lib/addPlugin');
const { deleteFolder } = require('./cypress/plugins/deleteFolder');

module.exports = defineConfig({
  e2e: {
    trashAssetsBeforeRun: true,
    setupNodeEvents(on) {
      on('task', { downloadFile });
      on('task', { deleteFolder });
    }
  }
});
