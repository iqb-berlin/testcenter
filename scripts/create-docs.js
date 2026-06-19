/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Haupt-Pipeline zur Orchestrierung aller Dokumentationsgeneratoren.
 */
const fs = require('fs');
const gulp = require('gulp');
const { testtakerDocs } = require('./create-docs-testtaker');
const { bookletDocs } = require('./create-docs-booklet');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;

exports.oldDocsIndex = done => {
  cliPrint.headline('Creating old version index file...');

  const pkg = JSON.parse(
    fs.readFileSync('../package.json', 'utf8')
  );

  const versions = pkg.doc?.versionIndex ?? [];

  if (versions.length < 1) {
    cliPrint.headline('No old versions found.');
    done();
  }

  const links = versions
    .map(version => `<li><a href="../${version}/">${version}</a></li>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Documentation for older IQB-Testcenter versions</title>
</head>
<body>
  <h1>Documentation for older IQB-Testcenter versions</h1>

  <ul>
    ${links}
  </ul>
</body>
</html>
`;

  fs.writeFileSync(`${docsDir}/version-index.html`, html);
  done();
};

exports.createDocs = gulp.series(
  bookletDocs,
  testtakerDocs
);
