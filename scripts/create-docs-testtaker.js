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
  { prefix: 'login_',    title: 'Anmeldeseite (`login_*`)',       description: 'Texte für die Anmeldeseite und allgemeine UI-Elemente.' },
  { prefix: 'booklet_',  title: 'Testheft-Ansicht (`booklet_*`)', description: 'Texte für die Testheft-Ansicht, Navigation und Dialoge.' },
  { prefix: 'syscheck_', title: 'System-Check (`syscheck_*`)',    description: 'Texte für den System-Check.' },
  { prefix: 'gm_',       title: 'Gruppenmonitor (`gm_*`)',        description: 'Texte für den Gruppenmonitor.' }
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
  let out = '\n**Mögliche Werte:**\n';
  prop.enum.forEach(value => {
    const desc = prop.enumDescriptions?.[value] ? ` – ${prop.enumDescriptions[value]}` : '';
    const isDefault = value === prop.default ? ' *(Standard)*' : '';
    out += ` * \`${value}\`${isDefault}${desc}\n`;
  });
  return out;
};

const renderDefault = prop => {
  if (prop.default === undefined) return '';
  const val = String(prop.default);
  if (val.includes('\n')) return `\n**Standard:**\n\`\`\`\n${val}\n\`\`\`\n`;
  return `\n**Standard:** \`${val}\`\n`;
};

const renderExamples = prop => {
  if (!prop.examples || prop.examples.length === 0) return '';
  const examples = prop.examples.map(e => `\`${e}\``).join(', ');
  return `\n**Beispiele:** ${examples}\n`;
};

const renderRef = ref => {
  if (!ref) return '';
  const name = ref.replace('#/$defs/', '');
  return `\n→ Siehe [\`${name}\`](#${anchor(name)})\n`;
};

// Forward declaration – renderProperty and renderProperties call each other
let renderProperties;

const renderProperty = (key, prop, schema, headingLevel = 4) => {
  const resolved = resolve(prop, schema);
  const isDeprecated = resolved.deprecated === true;
  const required = prop._required ? ' *(Pflichtfeld)*' : '';
  const badge = isDeprecated ? ' ⚠️ *deprecated*' : '';
  const heading = '#'.repeat(headingLevel);

  let out = `\n${heading} \`${key}\`${badge}${required}\n\n`;
  out += renderDeprecation(resolved);

  const typeLine = renderType(resolved);
  if (typeLine) out += `${typeLine}\n\n`;

  out += `${resolved.description ?? resolved.title ?? ''}\n`;
  out += renderDefault(resolved);
  out += renderExamples(resolved);
  out += renderEnum(resolved);

  if (resolved.properties) {
    out += renderProperties(resolved.properties, resolved.required ?? [], schema, headingLevel + 1);
  }

  if (resolved.type === 'array' && resolved.items?.$ref) {
    out += renderRef(resolved.items.$ref);
  }

  if (prop.$ref) {
    out += renderRef(prop.$ref);
  }

  return out;
};

renderProperties = (properties, required = [], schema, headingLevel = 4) => {
  let out = '';
  Object.keys(properties).forEach(key => {
    const prop = { ...properties[key], _required: required.includes(key) };
    out += renderProperty(key, prop, schema, headingLevel);
  });
  return out;
};

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

const renderMetadata = (schema, out) => {
  out += '\n## `metadata`\n\n';
  out += `${schema.properties.metadata.description}\n`;
  out += renderProperties(
    schema.properties.metadata.properties,
    schema.properties.metadata.required ?? [],
    schema
  );
  return out;
};

const renderCustomTexts = (schema, out) => {
  const properties = schema.properties.customTexts.properties;
  out += '\n## `customTexts`\n\n';
  out += `${schema.properties.customTexts.description}\n`;
  out += `\nInsgesamt ${Object.keys(properties).length} Schlüssel, gruppiert nach Kontext.\n`;

  const grouped = {};
  CUSTOM_TEXT_GROUPS.forEach(g => { grouped[g.prefix] = []; });
  grouped['_other'] = [];

  Object.keys(properties).forEach(key => {
    const group = CUSTOM_TEXT_GROUPS.find(g => key.startsWith(g.prefix));
    grouped[group ? group.prefix : '_other'].push(key);
  });

  CUSTOM_TEXT_GROUPS.forEach(groupDef => {
    const keys = grouped[groupDef.prefix];
    if (!keys.length) return;
    out += `\n### ${groupDef.title}\n\n${groupDef.description}\n`;
    keys.sort().forEach(key => {
      out += renderProperty(key, properties[key], schema, 4);
    });
  });

  if (grouped['_other'].length) {
    out += '\n### Sonstige\n';
    grouped['_other'].sort().forEach(key => {
      out += renderProperty(key, properties[key], schema, 4);
    });
  }

  return out;
};

const renderGroups = (schema, out) => {
  out += '\n## `groups`\n\n';
  out += `${schema.properties.groups.description}\n`;
  out += renderRef(schema.properties.groups.items.$ref);
  return out;
};

const renderProfiles = (schema, out) => {
  out += '\n## `profiles`\n\n';
  out += `${schema.properties.profiles.description}\n`;
  const gmProp = schema.properties.profiles.properties.groupMonitor;
  out += `\n### \`groupMonitor\`\n\n${gmProp.description}\n`;
  out += renderRef(gmProp.items.$ref);
  return out;
};

const renderDefs = (schema, out) => {
  out += '\n---\n\n## Typen (`$defs`)\n\n';
  out += 'Wiederverwendbare Typen, die per `$ref` referenziert werden.\n';

  Object.keys(schema.$defs).forEach(defName => {
    const def = schema.$defs[defName];
    out += `\n### ${defName}\n\n`;
    out += `${def.description ?? ''}\n`;

    const typeLine = renderType(def);
    if (typeLine) out += `\n${typeLine}\n`;

    out += renderEnum(def);

    if (def.properties) {
      out += renderProperties(def.properties, def.required ?? [], schema, 4);
    }

    if (def.type === 'array' && def.items?.$ref) {
      out += renderRef(def.items.$ref);
    }
  });

  return out;
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

exports.createDocs = done => {
  cliPrint.headline('Testtaker: Writing hierarchical Markdown documentation from JSON Schema');

  const schema = JSON.parse(fs.readFileSync(`${definitionsDir}/testtaker.schema.json`).toString());

  let output = `---\nlayout: default\n---\n\n# ${schema.title}\n\n${schema.description}\n`;

  output = renderMetadata(schema, output);
  output = renderCustomTexts(schema, output);
  output = renderGroups(schema, output);
  output = renderProfiles(schema, output);
  output = renderDefs(schema, output);

  fs.writeFileSync(`${docsDir}/pages/testtaker.md`, output, 'utf8');

  const totalKeys = Object.keys(schema.properties.customTexts.properties).length;
  const totalDefs = Object.keys(schema.$defs).length;
  cliPrint.headline(`Testtaker: Done. CustomTexts: ${totalKeys} keys, $defs: ${totalDefs} types.`);
  done();
};