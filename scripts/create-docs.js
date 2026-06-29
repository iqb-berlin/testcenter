/**
 * Haupt-Pipeline zur Orchestrierung aller Dokumentationsgeneratoren.
 */

const fs = require('fs');
const gulp = require('gulp');
const { testtakerDocs } = require('./create-docs-testtaker');
const { bookletDocs } = require('./create-docs-booklet');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;

const copyReadme = done => {
  const output = fs.readFileSync(`${rootPath}/README.md`, 'utf8').toString();
  const prefix = '---\nlayout: default\n---\n';
  fs.writeFileSync(`${docsDir}/index.md`, prefix + output, 'utf8');
  done();
};

exports.createDocs = gulp.series(
  copyReadme,
  bookletDocs,
  testtakerDocs
);
