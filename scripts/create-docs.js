/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * A lot of documentation is generated from the sources. The functions (gulp-taks) to do so are collected in this file.
 */

const fs = require('fs');
const gulp = require('gulp');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}'/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions`;

/**
 * Creates documentation about super-states. To make the abundance of possible state-combinations of a running test
 * manageable for users (of the GM for example) they get boiled down to a defined set of so called super-states.
 *
 * See the result and read more: https://iqb-berlin.github.io/testcenter/pages/booklet-config
 * Read more in user's manual (german):
 * https://github.com/iqb-berlin/iqb-berlin.github.io/wiki/Booklet%E2%80%90Xml#Konfiguration
 *
 * Primary Source of booklet-parameters is `/frontend/src/app/group-monitor/test-session/super-states`.
 * This is also directly included in the code.
 */
exports.testSessionSuperStates = done => {
  cliPrint.headline('SuperStates: Writing HTML documentation');

  // eslint-disable-next-line global-require
  const { superStates } = require('../frontend/src/app/group-monitor/test-session/super-states');

  let content = '';
  Object.keys(superStates).forEach(key => {
    const className = (typeof superStates[key].class !== 'undefined') ? superStates[key].class : '';
    content += `
<table>
  <tr>
    <td rowspan="3"><i class="${className} material-icons">${superStates[key].icon}</i></td>
    <td><strong>${key}</strong></td>
  </tr>
  <tr>
    <td>Tooltip: <code>${superStates[key].tooltip}</code></td>
  </tr>
   <tr>
    <td>${superStates[key].description}</td>
  </tr>
</table>
<br>
  `;
  });

  const template = fs.readFileSync(`${docsDir}/src/test-session-super-states.html`).toString();
  const output = template.replace('%%%CONTENT%%%', content);
  fs.writeFileSync(`${docsDir}/pages/test-session-super-states.html`, output);
  done();
};

/**
 * Creates documentation about booklet-configurations. Booklet-parameters are various configuration parameters for
 * adjusting the behaviour during a test execution.
 *
 * See the result and read more: https://iqb-berlin.github.io/testcenter/pages/booklet-config
 * Read more in user's manual (german):
 * https://github.com/iqb-berlin/iqb-berlin.github.io/wiki/Booklet%E2%80%90Xml#Konfiguration
 *
 * Primary Source of booklet-parameters is `definitions/booklet-config.json`. This is used to generate an interface
 * and the docs (with the task below).
 * TODO make the primary source be `definitions/vo_booklet.xsd`.
 */
exports.bookletConfig = done => {
  cliPrint.headline('BookletConfig: Writing Markdown documentation');

  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/booklet-config.json`).toString());

  let output = fs.readFileSync(`${docsDir}/src/booklet-config.md`, 'utf8').toString();

  Object.keys(definition)
    .forEach(configParameter => {
      output += `\n### ${configParameter}\n${definition[configParameter].label}\n`;
      if (definition[configParameter].options && Object.keys(definition[configParameter].options).length) {
        Object.keys(definition[configParameter].options)
          .forEach(value => {
            const isDefault = (value === definition[configParameter].defaultvalue) ? '**' : '';
            output += ` * ${isDefault}"${value}" - ${definition[configParameter].options[value]}${isDefault}\n`;
          });
      } else {
        output += ` * **${definition[configParameter].defaultvalue}**\n`;
      }
    });

  fs.writeFileSync(`${docsDir}/pages/booklet-config.md`, output, 'utf8');
  done();
};

/**
 * Creates documentation about the available modes of test-execution.
 *
 * See result and read more: https://iqb-berlin.github.io/testcenter/pages/test-mode
 * Read more in user's manual (german):
 * https://github.com/iqb-berlin/iqb-berlin.github.io/wiki/Login:-Modi-der-Testdurchf%C3%BChrung
 *
 * Primary Source of test-modes are `definitions/test-mode.json` and `definitions/test-mode.json`.
 * This is used to generate an interface and the docs (with the task below).
 * TODO make the primary source be `definitions/vo_testtakers.xsd`.
 */
exports.testMode = done => {
  cliPrint.headline('TestMode: Writing Markdown documentation');

  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/test-mode.json`).toString());
  const modeOptions = JSON.parse(fs.readFileSync(`${definitionsDir}/mode-options.json`).toString());

  let output = fs.readFileSync(`${docsDir}/src/test-mode.md`, 'utf8').toString();

  let tableHeader1 = '|  | ';
  let tableHeader2 = '| :------------- |';
  Object.keys(definition).forEach(k => {
    output += `* \`${k}${k === 'RUN-DEMO' ? '` (default): ' : '`: '}${definition[k].label}\n`;
    tableHeader1 += `\`${k}\` | `;
    tableHeader2 += ' :-------------: |';
  });
  output += `\n\n${tableHeader1}\n${tableHeader2}\n`;
  Object.keys(modeOptions).forEach(mode => {
    output += `|${modeOptions[mode]}|`;
    Object.keys(definition).forEach(k => {
      output += definition[k].config[mode] ? 'X |' : '  |';
    });
    output += '\n';
  });
  fs.writeFileSync(`${docsDir}/pages/test-mode.md`, output, 'utf8');

  done();
};

/**
 * Creates documentation about the available custom-texts. Custom-texts is an internal system to replace labels in the
 * UI in defined contexts.
 *
 * See result and read more: https://pages.cms.hu-berlin.de/iqb/testcenter/pages/custom-texts.html
 * Read more in user's manual (german): https://github.com/iqb-berlin/iqb-berlin.github.io/wiki/2-Testcenter
 *
 * Primary Source of test-modes is `custom-texts.json`. This is used to generate an interface
 * and the docs (with the task below).
 * TODO make the primary source be an XSD file.
 */
exports.customTexts = done => {
  cliPrint.headline('customTexts: Writing Markdown documentation');
  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/custom-texts.json`).toString());
  let output = fs.readFileSync(`${docsDir}/src/custom-texts.md`, 'utf8').toString();
  output += '### List of possible replacements\n\n';
  output += '| Key       | Used for     | Default     |\n';
  output += '| :------------- | :---------- | :----------- |\n';

  Object.keys(definition)
    .sort()
    .forEach(key => {
      output += `|${key}|${definition[key].label}|${definition[key].defaultvalue}|\n`;
    });

  fs.writeFileSync(`${docsDir}/pages/custom-texts.md`, output, 'utf8');
  done();
};

const copyReadme = done => {
  const output = fs.readFileSync(`${rootPath}/README.md`, 'utf8').toString();
  const prefix = '---\nlayout: default\n---\n';
  fs.writeFileSync(`${docsDir}/index.md`, prefix + output, 'utf8');
  done();
};

exports.createDocs = gulp.series(
  copyReadme,
  exports.testSessionSuperStates,
  exports.bookletConfig,
  exports.testMode,
  exports.customTexts
);
