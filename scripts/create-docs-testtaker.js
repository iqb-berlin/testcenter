/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Generates hierarchical Markdown documentation for the Testtaker XML format
 * from its JSON schema.
 *
 * Covers all top-level properties and $defs:
 *   metadata, customTexts, groups, profiles
 *   + all $defs: Group, Login, BookletAssignment, ProfileReference,
 *                AssetAssignment, ViewSettings, GroupMonitorProfile,
 *                ColumnSetting, FilterSetting, MonitorFilter
 *
 * Primary source: `definitions/testtaker.schema.json`
 * Output:         `docs/pages/testtaker.md`
 *
 * Integration in create-docs.js:
 *   const { testtakerDocs } = require('./create-testtaker-docs');
 *   exports.createDocs = gulp.series(..., testtakerDocs);
 */

const fs = require('fs');
const gulp = require('gulp');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a $ref like "#/$defs/Group" against the schema and returns the
 * referenced definition (without mutating anything).
 */
const resolveRef = (ref, schema) => {
  if (!ref || !ref.startsWith('#/')) return null;
  const parts = ref.replace('#/', '').split('/');
  return parts.reduce((node, part) => (node ? node[part] : null), schema);
};

/**
 * Returns the effective schema node for a property, resolving $ref if present.
 */
const resolve = (prop, schema) => {
  if (prop.$ref) return { ...resolveRef(prop.$ref, schema), ...prop, $ref: undefined };
  return prop;
};

/** Anchor-safe lowercase id from a heading string. */
const anchor = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

const CUSTOM_TEXT_GROUPS = [
  { prefix: 'login_', title: 'Anmeldeseite (`login_*`)', description: 'Texte für die Anmeldeseite und allgemeine UI-Elemente.' },
  { prefix: 'booklet_', title: 'Testheft-Ansicht (`booklet_*`)', description: 'Texte für die Testheft-Ansicht, Navigation und Dialoge.' },
  { prefix: 'syscheck_', title: 'System-Check (`syscheck_*`)', description: 'Texte für den System-Check.' },
  { prefix: 'gm_', title: 'Gruppenmonitor (`gm_*`)', description: 'Texte für den Gruppenmonitor.' }
];

const renderDeprecation = prop => {
  if (!prop.deprecated) return '';
  const note = prop.deprecationNote ?? 'Dieser Parameter sollte nicht mehr verwendet werden.';
  return `> **Veraltet:** ${note}\n\n`;
};

const renderType = prop => {
  if (prop.type) return `*${prop.type}*`;
  if (prop.enum) return '*string (enum)*';
  return '';
};

const renderEnum = prop => {
  if (!prop.enum) return '';
  let result = '\nMögliche Werte:\n';
  prop.enum.forEach(value => {
    const desc = prop.enumDescriptions?.[value] ? ` – ${prop.enumDescriptions[value]}` : '';
    const isDefault = value === prop.default ? ' *(Standard)*' : '';
    result += ` * \`${value}\`${isDefault}${desc}\n`;
  });
  return result;
};

const renderDefault = prop => {
  if (prop.default === undefined) return '';
  const val = String(prop.default);
  return `\n**Standard:** ${val}\n`;
};

const renderExamples = prop => {
  if (!prop.examples || prop.examples.length === 0) return '';
  const examples = prop.examples.map(e => `\`${e}\``).join(', ');
  return `\nBeispiele: ${examples}\n`;
};

const renderRef = ref => {
  if (!ref) return '';
  const name = ref.replace('#/$defs/', '');
  return `\n→ Siehe [\`${name}\`](#${anchor(name)})\n`;
};

// Forward declaration – renderProperty and renderProperties call each other
let renderProperties;

const renderProperty = (key, prop, schema, headingLevel = 4, withType = false) => {
  const resolved = resolve(prop, schema);
  const isDeprecated = resolved.deprecated === true;
  const requiredLabel = prop.isRequired ? ' *(Pflichtfeld)*' : '';
  const badge = isDeprecated ? ' ⚠️ *deprecated*' : '';
  const heading = '#'.repeat(headingLevel);

  let result = `\n${heading} \`${key}\`${badge}${requiredLabel}\n\n`;
  result += renderDeprecation(resolved);

  if (withType) {
    const typeLine = renderType(resolved);
    if (typeLine) result += `${typeLine}\n\n`;
  }

  result += `${resolved.description ?? resolved.title ?? ''}\n`;
  result += renderDefault(resolved);
  result += renderExamples(resolved);
  result += renderEnum(resolved);

  if (resolved.properties) {
    result += renderProperties(resolved.properties, schema, resolved.required ?? [], headingLevel + 1);
  }

  if (resolved.type === 'array' && resolved.items?.$ref) {
    result += renderRef(resolved.items.$ref);
  }

  if (prop.$ref) {
    result += renderRef(prop.$ref);
  }

  return result;
};

renderProperties = (properties, schema, required = [], headingLevel = 4) => {
  let result = '';
  Object.keys(properties).forEach(key => {
    const prop = { ...properties[key], isRequired: required.includes(key) };
    result += renderProperty(key, prop, schema, headingLevel);
  });
  return result;
};

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

const renderMetadata = (schema, current) => {
  let result = current;
  result += '\n## `metadata`\n\n';
  result += `${schema.properties.metadata.description}\n`;
  result += renderProperties(
    schema.properties.metadata.properties,
    schema,
    schema.properties.metadata.required ?? []
  );
  return result;
};

const renderCustomTexts = (schema, current, withHeader = false) => {
  const properties = schema.properties.customTexts.properties;
  let result = current;
  if (withHeader) {
    result += '\n## `customTexts`\n\n';
    result += `${schema.properties.customTexts.description}\n`;
    result += `\nInsgesamt ${Object.keys(properties).length} Schlüssel, gruppiert nach Kontext.\n`;
  }

  const grouped = {};
  CUSTOM_TEXT_GROUPS.forEach(g => { grouped[g.prefix] = []; });
  grouped.other = [];

  Object.keys(properties).forEach(key => {
    const group = CUSTOM_TEXT_GROUPS.find(g => key.startsWith(g.prefix));
    grouped[group ? group.prefix : 'other'].push(key);
  });

  CUSTOM_TEXT_GROUPS.forEach(groupDef => {
    const keys = grouped[groupDef.prefix];
    if (!keys.length) return;
    result += `\n## ${groupDef.title}\n\n${groupDef.description}\n`;
    keys.sort().forEach((key, index) => {
      if (index > 0) result += '\n***\n\n';
      result += renderProperty(key, properties[key], schema, 3, false);
    });
  });

  if (grouped.other.length) {
    result += '\n## Sonstige\n';
    grouped.other.sort().forEach((key, index) => {
      if (index > 0) result += '\n***\n\n';
      result += renderProperty(key, properties[key], schema, 3, false);
    });
  }

  return result;
};

const renderGroups = (schema, current) => {
  let result = current;
  result += '\n## `groups`\n\n';
  result += `${schema.properties.groups.description}\n`;
  result += renderRef(schema.properties.groups.items.$ref);
  return result;
};

const renderProfiles = (schema, current) => {
  let result = current;
  result += '\n## `profiles`\n\n';
  result += `${schema.properties.profiles.description}\n`;
  const gmProp = schema.properties.profiles.properties.groupMonitor;
  result += `\n### \`groupMonitor\`\n\n${gmProp.description}\n`;
  result += renderRef(gmProp.items.$ref);
  return result;
};

const renderDefs = (schema, current) => {
  let result = current;

  Object.keys(schema.$defs).forEach(defName => {
    const def = schema.$defs[defName];
    result += `\n### ${defName}\n\n`;
    result += `${def.description ?? ''}\n`;

    result += renderEnum(def);

    if (def.properties) {
      result += renderProperties(def.properties, schema, def.required ?? [], 4);
    }

    if (def.type === 'array' && def.items?.$ref) {
      result += renderRef(def.items.$ref);
    }
  });

  return result;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const readSchema = () => JSON.parse(fs.readFileSync(`${definitionsDir}/testtaker.schema.json`).toString());

const testtakerFile = `${docsDir}/pages/testtaker.md`;
const customTextsFile = `${docsDir}/pages/custom-texts.md`;

const readFile = filePath => (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');
const writeFile = (filePath, content) => fs.writeFileSync(filePath, content, 'utf8');

// ---------------------------------------------------------------------------
// Individual exports – testtaker.md
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Individual exports – custom-texts.md (separate file)
// ---------------------------------------------------------------------------

exports.testtakerCustomTexts = done => {
  cliPrint.headline('Testtaker CustomTexts: Writing customTexts section');
  const schema = readSchema();
  const base = fs.readFileSync(`${docsDir}/src/custom-texts.md`, 'utf8');
  writeFile(customTextsFile, renderCustomTexts(schema, base, false));
  done();
};

// ---------------------------------------------------------------------------
// Combined tasks
// ---------------------------------------------------------------------------

exports.testtakerDocs = gulp.series(
  exports.testtakerHeader,
  exports.testtakerMetadata,
  exports.testtakerGroups,
  exports.testtakerProfiles,
  exports.testtakerDefs
);

exports.customTexts = gulp.series(
  exports.testtakerCustomTexts
);
