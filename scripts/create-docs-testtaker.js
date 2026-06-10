/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Generiert flache, stabile Markdown-Dokumentationen für das Testtaker XML-Format
 * basierend auf dem JSON-Schema, erweitert um strukturelle Pfad-Marker.
 */

const fs = require('fs');
const gulp = require('gulp');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions/testtaker`;

// ---------------------------------------------------------------------------
// Schema-Auflösung (Helpers)
// ---------------------------------------------------------------------------

// Löst interne JSON-Schema-Referenzen (#/$defs/...) auf
const resolveRef = (ref, schema) => {
  if (!ref || !ref.startsWith('#/')) return null;
  const parts = ref.replace('#/', '').split('/');
  return parts.reduce((node, part) => (node ? node[part] : null), schema);
};

// Überführt ein Referenz-Objekt in flache Eigenschaften
const resolve = (prop, schema) => {
  if (prop.$ref) return { ...resolveRef(prop.$ref, schema), ...prop, $ref: undefined };
  return prop;
};

// Erzeugt einen gültigen HTML/Markdown-Anchor aus Texten
const anchor = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---------------------------------------------------------------------------
// Markdown-Rendering-Komponenten
// ---------------------------------------------------------------------------

// Generiert Warnhinweise für veraltete Parameter (deprecated)
const renderDeprecation = prop => {
  if (!prop.deprecated) return '';
  const note = prop.deprecationNote ?? 'Dieser Parameter sollte nicht mehr verwendet werden.';
  return `\n> ⚠️ **Veraltet:** ${note}\n\n`;
};

// Ermittelt den Typ-Badge für das Feld (z.B. enum oder string)
const renderTypeBadge = prop => {
  if (prop.enum) return '`enum`';
  if (prop.type) return `\`${prop.type}\``;
  return '';
};

// Rendert Listen von erlaubten Werten (Enums) kompakt in einer Zeile
const renderEnumList = prop => {
  if (!prop.enum || prop.enum.length === 0) return '';
  let list = '\nErlaubte Werte:\n';

  prop.enum.forEach(value => {
    let desc = prop.enumDescriptions?.[value] ? prop.enumDescriptions[value] : '';
    if (value === prop.default) {
      desc = `*(Standard)* ${desc}`.trim();
    }
    list += desc ? `* \`${value}\`: ${desc}\n` : `* \`${value}\`\n`;
  });
  return list;
};

// Rendert Standardwerte und Bespieldaten
const renderDefaultAndExamples = prop => {
  const meta = [];
  if (prop.default !== undefined) {
    meta.push(`Standard: \`${prop.default}\``);
  }
  if (prop.examples && prop.examples.length > 0) {
    const ex = prop.examples.map(e => `\`${e}\``).join(', ');
    meta.push(`Beispiele: ${ex}`);
  }
  return meta.length > 0 ? `\n${meta.join(' • ')}\n` : '';
};

// Erzeugt einen "Siehe..."-Verweis auf globale Definitionen
const renderRef = ref => {
  if (!ref) return '';
  const name = ref.replace('#/$defs/', '');
  return ` → Siehe [\`${name}\`](#${anchor(name)})`;
};

const renderProperty = (key, prop, schema, requiredList = [], parentPath = '', forcedRef = null) => {
  const resolved = resolve(prop, schema);
  const isRequired = requiredList.includes(key);
  const isDeprecated = resolved.deprecated === true;
  const currentPath = parentPath ? `${parentPath}.${key}` : key;

  const badges = [];
  const typeBadge = renderTypeBadge(resolved);
  if (typeBadge) badges.push(typeBadge);
  if (isRequired) badges.push('**`Pflichtfeld`**');
  if (isDeprecated) badges.push('⚠️ *deprecated*');

  const badgeString = badges.length > 0 ? ` (${badges.join(' • ')})` : '';
  let result = `### ▪ \`${currentPath}\`${badgeString}\n\n`;

  result += renderDeprecation(resolved);
  const desc = resolved.description ?? resolved.title ?? '';
  if (desc) result += `${desc}\n`;

  result += renderDefaultAndExamples(resolved);
  result += renderEnumList(resolved);

  if (resolved.type === 'array' && resolved.items?.$ref) {
    result += `\nTyp: Array aus ${renderRef(resolved.items.$ref)}\n`;
  }

  // KORREKTUR: Wir blenden den Link nur ein, wenn es sich NICHT um ein reines Enum handelt.
  // Da ColumnSetting/FilterSetting reine Enums sind, wird hier kein toter Link mehr erzeugt.
  const refToRender = forcedRef || prop.$ref;
  if (refToRender && resolved.type !== 'array' && !resolved.enum) {
    result += `\nStruktur: ${renderRef(refToRender)}\n`;
  }

  result += '\n';
  return result;
};

// Iteriert durch eine Liste von Eigenschaften und sichert spezifische Definitionen
const renderPropertiesList = (properties, schema, required = [], parentPath = '') => {
  let result = '';
  Object.keys(properties).forEach(key => {
    const originalProp = properties[key];
    const originalRef = originalProp ? originalProp.$ref : null;

    if (originalProp && originalProp.description) {
      // Erzwingt lokale Beschreibungen gegenüber globalen Referenz-Texten
      const clonedProp = { ...originalProp };
      const resolved = resolve(clonedProp, schema);
      resolved.description = originalProp.description;
      result += renderProperty(key, resolved, schema, required, parentPath, originalRef);
    } else {
      result += renderProperty(key, originalProp, schema, required, parentPath, originalRef);
    }
  });
  return result;
};

// ---------------------------------------------------------------------------
// Sektions-Renderer (Hauptblöcke der Dokumentation)
// ---------------------------------------------------------------------------

const renderMetadata = (schema, current) => {
  let result = current;
  result += '\n## Metadata\n\n';
  result += `${schema.properties.metadata.description}\n\n`;
  result += renderPropertiesList(
    schema.properties.metadata.properties,
    schema,
    schema.properties.metadata.required ?? [],
    'metadata'
  );
  return result;
};

const renderCustomTextsRef = (schema, current) => {
  let result = current;
  result += '\n## CustomTexts\n\n';
  result += `${schema.properties.customTexts.description}\n`;
  result += '\n→ Siehe [CustomTexts](custom-texts.html)\n';
  return result;
};

const renderGroups = (schema, current) => {
  let result = current;
  result += '\n## Group\n\n';
  result += `${schema.properties.groups.description}\n`;
  result += `\nTyp: Array aus ${renderRef(schema.properties.groups.items.$ref)}\n`;
  return result;
};

const renderProfiles = (schema, current) => {
  let result = current;
  result += '\n## Profiles\n\n';
  result += `${schema.properties.profiles.description}\n`;
  const gmProp = schema.properties.profiles.properties.groupMonitor;
  result += `\n### \`GroupMonitor\`\n\n${gmProp.description}\n`;
  result += `\nTyp: Array aus ${renderRef(gmProp.items.$ref)}\n`;
  return result;
};

// Rendert globale Sektionen am Ende ($defs), filtert reine Hilfs-Enums heraus
const renderDefs = (schema, current) => {
  let result = current;
  result += '\n---\n';

  const excludeList = ['ColumnSetting', 'FilterSetting'];

  Object.keys(schema.$defs).forEach(defName => {
    if (excludeList.includes(defName)) return;

    const def = schema.$defs[defName];
    result += `\n## \`${defName}\`\n\n`;
    if (def.description) result += `${def.description}\n\n`;

    if (def.properties) {
      result += renderPropertiesList(def.properties, schema, def.required ?? [], defName);
    }
    if (def.type === 'array' && def.items?.$ref) {
      result += `\nTyp: Array aus ${renderRef(def.items.$ref)}\n`;
    }
    result += '\n';
  });
  return result;
};

// ---------------------------------------------------------------------------
// Migrierte Gulp-Tasks aus create-docs.js
// ---------------------------------------------------------------------------

exports.testSessionSuperStates = done => {
  cliPrint.headline('SuperStates: Writing HTML documentation');

  require('ts-node/register');

  const { superStates } = require(
    '../frontend/src/app/group-monitor/test-session/super-states.ts'
  );

  let content = '';
  Object.keys(superStates).forEach(key => {
    const className = (typeof superStates[key].class !== 'undefined') ? superStates[key].class : '';

    // KORREKTUR: CSS-Styles für fest definierte Breiten und automatischen Umbruch hinzugefügt
    content += `
<table style="width: 100%; max-width: 800px; table-layout: fixed; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td rowspan="3" style="width: 60px; text-align: center; vertical-align: middle; border: 1px solid #ddd;">
      <i class="${className} material-icons" style="font-size: 36px;">${superStates[key].icon}</i>
    </td>
    <td style="padding: 8px; border: 1px solid #ddd; word-break: break-word; font-size: 1.1em;">
      <strong>${key}</strong>
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; word-break: break-word;">
      Tooltip: <code style="white-space: pre-wrap; word-break: break-all;">${superStates[key].tooltip}</code>
    </td>
  </tr>
   <tr>
    <td style="padding: 8px; border: 1px solid #ddd; word-break: break-word; white-space: normal;">
      ${superStates[key].description}
    </td>
  </tr>
</table>
  `;
  });

  const template = fs.readFileSync(`${docsDir}/src/test-session-super-states.html`).toString();
  const output = template.replace('%%%CONTENT%%%', content);
  fs.writeFileSync(`${docsDir}/pages/test-session-super-states.html`, output);
  done();
};

exports.testMode = done => {
  cliPrint.headline('TestMode: Writing Markdown documentation');

  // Angepasste Pfade: Liegen nun direkt in definitions/testtaker
  const definition = JSON.parse(fs.readFileSync(`${definitionsDir}/test-mode.json`).toString());
  const modeOptions = JSON.parse(fs.readFileSync(`${definitionsDir}/mode-options.json`).toString());

  let output = fs.readFileSync(`${docsDir}/src/test-mode.md`, 'utf8').toString();

  output += '\n### Verfügbare Modi\n\n';
  Object.keys(definition).forEach(k => {
    output += `* \`${k}${k === 'RUN-DEMO' ? '` (default): ' : '`: '}${definition[k].label}\n`;
  });

  output += '\n### Merkmale der Modi\n\n';
  const optionsKeys = Object.keys(modeOptions);
  optionsKeys.forEach((mode, index) => {
    output += `${index + 1}. ${modeOptions[mode]}\n`;
  });

  output += '\n';

  const tableHeader1 = `| Modus | ${optionsKeys.map((_, i) => ` ${i + 1} |`).join('')}`;
  const tableHeader2 = `| :--- | ${optionsKeys.map(() => ' :---: |').join('')}`;

  output += `${tableHeader1}\n${tableHeader2}\n`;

  Object.keys(definition).forEach(k => {
    let row = `| \`${k}\` | `;
    optionsKeys.forEach(mode => {
      row += definition[k].config[mode] ? ' ✅ |' : '  |';
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

// ---------------------------------------------------------------------------
// Native Testtaker-Schema Tasks
// ---------------------------------------------------------------------------

const readSchema = () => JSON.parse(fs.readFileSync(`${definitionsDir}/testtaker.schema.json`).toString());
const testtakerFile = `${docsDir}/pages/testtaker.md`;
const readFile = filePath => (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');
const writeFile = (filePath, content) => fs.writeFileSync(filePath, content, 'utf8');

exports.testtakerHeader = done => {
  cliPrint.headline('Testtaker: Writing header');
  const base = fs.readFileSync(`${docsDir}/src/testtaker.md`, 'utf8');
  writeFile(testtakerFile, base);
  done();
};

exports.testtakerMetadata = done => {
  cliPrint.headline('Testtaker: Writing metadata section');
  const schema = readSchema();
  writeFile(testtakerFile, renderMetadata(schema, readFile(testtakerFile)));
  done();
};

exports.testtakerCustomTextsRef = done => {
  cliPrint.headline('Testtaker: Writing customTexts reference section');
  const schema = readSchema();
  writeFile(testtakerFile, renderCustomTextsRef(schema, readFile(testtakerFile)));
  done();
};

exports.testtakerGroups = done => {
  cliPrint.headline('Testtaker: Writing groups section');
  const schema = readSchema();
  writeFile(testtakerFile, renderGroups(schema, readFile(testtakerFile)));
  done();
};

exports.testtakerProfiles = done => {
  cliPrint.headline('Testtaker: Writing profiles section');
  const schema = readSchema();
  writeFile(testtakerFile, renderProfiles(schema, readFile(testtakerFile)));
  done();
};

exports.testtakerDefs = done => {
  cliPrint.headline('Testtaker: Writing $defs section');
  const schema = readSchema();
  writeFile(testtakerFile, renderDefs(schema, readFile(testtakerFile)));
  done();
};

// Interner Verbund-Task für das Schema
const testtakerDocsNative = gulp.series(
  exports.testtakerHeader,
  exports.testtakerMetadata,
  exports.testtakerCustomTextsRef,
  exports.testtakerGroups,
  exports.testtakerProfiles,
  exports.testtakerDefs
);

// Allumfassende Haupt-Pipeline Task
exports.testtakerDocs = gulp.series(
  exports.testSessionSuperStates,
  exports.testMode,
  exports.customTexts,
  testtakerDocsNative
);
