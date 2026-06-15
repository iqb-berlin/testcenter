/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Haupt-Pipeline zur Orchestrierung aller Dokumentationsgeneratoren.
 */
const fs = require('fs');
const gulp = require('gulp');
const { testtakerDocs } = require('./create-docs-testtaker');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions`;

/**
 * Erstellt die Markdown-Dokumentation für Booklet-Konfigurationen.
 */
exports.bookletConfig = done => {
  cliPrint.headline('BookletConfig: Writing Markdown documentation');

  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/booklet-config.json`).toString());
  let output = fs.readFileSync(`${docsDir}/src/booklet-config.md`, 'utf8').toString();

  Object.keys(definition).forEach(configParameter => {
    const param = definition[configParameter];

    output += `\n### \`${configParameter}\`\n`;

    if (param.deprecated === true) {
      output += [
        '> ⚠️ **Abgekündigt**',
        '>',
        '> Dieser Parameter sollte nicht mehr verwendet werden.',
        '> Er wird in einer kommenden Version entfernt.',
        '>',
        `> ${param.deprecationNote ?? ''}`,
        ''
      ].join('\n');
      output += '\n\n';
    }

    output += `${param.label}\n`;

    if (param.options && Object.keys(param.options).length) {
      Object.keys(param.options).forEach(value => {
        const isDefault = (value === param.defaultvalue) ? '**' : '';
        output += ` * ${isDefault}"${value}" - ${param.options[value]}${isDefault}\n`;
      });
    } else {
      output += ` * **${param.defaultvalue}**\n`;
    }
  });

  fs.writeFileSync(`${docsDir}/pages/booklet-config.md`, output, 'utf8');
  done();
};

const copyReadme = done => {
  const output = fs.readFileSync(`${rootPath}/README.md`, 'utf8').toString();
  const prefix = '---\nlayout: default\n---\n';
  fs.writeFileSync(`${docsDir}/index.md`, prefix + output, 'utf8');
  done();
};

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
  copyReadme,
  //exports.bookletConfig,
  exports.oldDocsIndex,
  testtakerDocs
);
