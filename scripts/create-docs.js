/* eslint-disable no-console,import/no-extraneous-dependencies */
const fs = require('fs');
const gulp = require('gulp');
const cliPrint = require('./helper/cli-print');

const docsDir = fs.realpathSync(`${__dirname}'/../docs`);
const definitionsDir = fs.realpathSync(`${__dirname}'/../definitions`);

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

  const template = fs.readFileSync(`${docsDir}/src/test-session-super-states/template.html`).toString();
  const output = template.replace('%%%CONTENT%%%', content);
  fs.writeFileSync(`${docsDir}/dist/test-session-super-states.html`, output);
  done();
};

exports.bookletConfig = done => {
  cliPrint.headline('BookletConfig: Writing Markdown documentation');

  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/booklet-config.json`).toString());

  let output = fs.readFileSync(`${docsDir}/src/booklet-config/booklet-config.md`).toString();

  Object.keys(definition)
    .forEach(configParameter => {
      output += `\n#### \`${configParameter}\`\n${definition[configParameter].label}\n`;
      Object.keys(definition[configParameter].options)
        .forEach(value => {
          const isDefault = (value === definition[configParameter].defaultvalue) ? '(default)' : '';
          output += ` * "${value}" ${isDefault} ${definition[configParameter].options[value]}\n`;
        });
    });

  fs.writeFileSync(`${docsDir}/dist/booklet-config.md`, output);
  done();
};

exports.createDocs = gulp.series(
  exports.testSessionSuperStates,
  exports.bookletConfig
);
