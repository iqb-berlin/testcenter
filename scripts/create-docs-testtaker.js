/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Generiert Dokumentationen für Testtaker-Teilbereiche
 * (SuperStates, TestMode und CustomTexts).
 */

const fs = require('fs');
const gulp = require('gulp');
require('ts-node/register');
const cliPrint = require('./helper/cli-print');
const { superStates } = require('../frontend/src/app/group-monitor/test-session/super-states.ts');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions/testtaker`;

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

exports.testSessionSuperStates = done => {
  cliPrint.headline('SuperStates: Writing HTML documentation');
  const content = Object.entries(superStates)
    .map(([key, state]) => {
      const className = state.class || ''; // Falls .class undefined ist

      return `
<table style="width: 100%; max-width: 800px; table-layout: fixed; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td rowspan="3" style="width: 60px; text-align: center; vertical-align: middle; border: 1px solid #ddd;">
      <i class="${className} material-icons" style="font-size: 36px;">${state.icon}</i>
    </td>
    <td style="padding: 8px; border: 1px solid #ddd; word-break: break-word; font-size: 1.1em;">
      <strong>${key}</strong>
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; word-break: break-word;">
      Tooltip: <code style="white-space: pre-wrap; word-break: break-all;">${state.tooltip}</code>
    </td>
  </tr>
   <tr>
    <td style="padding: 8px; border: 1px solid #ddd; word-break: break-word; white-space: normal;">
      ${state.description}
    </td>
  </tr>
</table>`;
    })
    .join('\n');
  const template = fs.readFileSync(`${docsDir}/src/test-session-super-states.html`, 'utf8');
  const output = template.replace('%%%CONTENT%%%', content);

  fs.writeFileSync(`${docsDir}/pages/test-session-super-states.html`, output, 'utf8');
  done();
};

exports.testMode = done => {
  cliPrint.headline('TestMode: Writing Markdown documentation');
  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/test-mode.json`).toString());
  const modeOptions = JSON.parse(fs.readFileSync(`${definitionsDir}/mode-options.json`).toString());
  let output = fs.readFileSync(`${docsDir}/src/test-mode.md`, 'utf8').toString();
  output += '\n### Verfügbare Modi\n\n';
  const modeKeys = Object.keys(definition);
  modeKeys.forEach(k => {
    output += `* \`${k}${k === 'RUN-DEMO' ? '` (default): ' : '`: '}${definition[k].label}\n`;
  });
  output += '\n### Merkmale der Modi im Vergleich\n\n';
  const tableHeader1 = `| Merkmal / Option | ${modeKeys.map(k => ` \`${k}\` |`).join('')}`;
  const tableHeader2 = `| :--- | ${modeKeys.map(() => ' :---: |').join('')}`;
  output += `${tableHeader1}\n${tableHeader2}\n`;
  const optionsKeys = Object.keys(modeOptions);
  optionsKeys.forEach(optionKey => {
    let row = `| ${modeOptions[optionKey]} | `;
    modeKeys.forEach(modeKey => {
      row += definition[modeKey].config[optionKey] ? ' ✅ |' : '  |';
    });
    output += `${row}\n`;
  });
  fs.writeFileSync(`${docsDir}/pages/test-mode.md`, output, 'utf8');
  done();
};

const CUSTOM_TEXT_GROUPS = [
  { prefix: 'login_', title: 'Anmeldeseite (`login_*`)', description: 'Texte für die Anmeldeseite und allgemeine UI-Elemente.' },
  { prefix: 'booklet_', title: 'Testheft-Ansicht (`booklet_*`)', description: 'Texte für die Testheft-Ansicht, Navigation und Dialoge.' },
  { prefix: 'syscheck_', title: 'System-Check (`syscheck_*`)', description: 'Texte für den System-Check.' },
  { prefix: 'gm_', title: 'Gruppenmonitor (`gm_*`)', description: 'Texte für den Gruppenmonitor.' }
];

exports.customTexts = done => {
  cliPrint.headline('customTexts: Writing Markdown documentation');
  // Angepasster Pfad: Liegt nun direkt in definitions/testtaker
  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/custom-texts.json`).toString());
  let output = fs.readFileSync(`${docsDir}/src/custom-texts.md`, 'utf8').toString();

  const grouped = {};
  CUSTOM_TEXT_GROUPS.forEach(g => { grouped[g.prefix] = []; });
  grouped.other = [];

  Object.keys(definition).forEach(key => {
    const group = CUSTOM_TEXT_GROUPS.find(g => key.startsWith(g.prefix));
    grouped[group ? group.prefix : 'other'].push(key);
  });

  CUSTOM_TEXT_GROUPS.forEach(groupDef => {
    const keys = grouped[groupDef.prefix];
    if (!keys.length) return;
    output += `\n# ${groupDef.title}\n\n${groupDef.description}\n`;
    keys.sort().forEach(key => {
      const param = definition[key];
      output += `\n## \`${key}\`\n\n`;
      output += `${param.label}\n`;
      output += `\nStandard: ${param.defaultvalue}\n`;
    });
  });

  if (grouped.other.length) {
    output += '\n# Sonstige\n';
    grouped.other.sort().forEach(key => {
      const param = definition[key];
      output += `\n## \`${key}\`\n\n`;
      output += `${param.label}\n`;
      output += `\nStandard: ${param.defaultvalue}\n`;
    });
  }

  fs.writeFileSync(`${docsDir}/pages/custom-texts.md`, output, 'utf8');
  done();
};

// Main-Pipeline Task
exports.testtakerDocs = gulp.series(
  exports.testSessionSuperStates,
  exports.testMode,
  exports.customTexts
);