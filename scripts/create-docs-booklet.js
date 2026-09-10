/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Generiert flache Markdown-Dokumentationen für die Booklet-Konfigurationsparameter.
 */

const fs = require('fs');
const gulp = require('gulp');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions/booklet`;

// ---------------------------------------------------------------------------
// Gulp-Task: Booklet-Config
// ---------------------------------------------------------------------------

exports.bookletConfig = done => {
  cliPrint.headline('BookletConfig: Writing Markdown documentation');

  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/booklet-config.json`).toString());
  let output = fs.readFileSync(`${docsDir}/src/booklet-config.md`, 'utf8').toString();

  Object.keys(definition).forEach(configParameter => {
    const param = definition[configParameter];

    output += `\n## \`${configParameter}\`\n`;

    if (param.deprecated === true) {
      // Basis-Meldung für abgekündigte Parameter
      let deprecationBlock = [
        '> ⚠️ **Abgekündigt**',
        '>',
        '> Dieser Parameter sollte nicht mehr verwendet werden.',
        '> Er wird in einer kommenden Version entfernt.',
        '>'
      ].join('\n');

      // Condition: Nur hinzufügen, wenn eine Notiz existiert und nicht leer ist
      if (param.deprecationNote && param.deprecationNote.trim() !== '') {
        deprecationBlock += `\n| > ${param.deprecationNote}\n`;
      } else {
        // Wenn keine Notiz da ist, abschließen des Blocks
        deprecationBlock += '\n';
      }

      output += `${deprecationBlock}\n`;
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

exports.bookletDocs = gulp.series(
  exports.bookletConfig
);