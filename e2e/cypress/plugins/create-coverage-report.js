/* eslint-disable no-console */
const { execSync } = require('child_process');

module.exports = function createCodeCoverageReport() {
  try {
    console.log(execSync('npx nyc report --reporter=text-summary --reporter=lcov --report-dir=/docs/dist/test-coverage-frontend-system').toString());
  } catch (error) {
    console.error(`Error while creating code coverage... : ${error.message} (${error.stderr})`);
  }
};
