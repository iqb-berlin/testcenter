/* eslint-disable no-console,import/no-extraneous-dependencies */

/**
 * Generiert flache, Markdown-Dokumentationen für das Booklet XML-Format
 * sowie die dazugehörigen Booklet-Konfigurationsparameter.
 */

const fs = require('fs');
const gulp = require('gulp');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}/..`);
const docsDir = `${rootPath}/docs`;
const definitionsDir = `${rootPath}/definitions/booklet`;

const readMainSchema = () => JSON.parse(fs.readFileSync(`${definitionsDir}/booklet.schema.json`).toString());
const readAdaptiveSchema = () => JSON.parse(fs.readFileSync(`${definitionsDir}/adaptive-config.json`).toString());

// ---------------------------------------------------------------------------
// Schema-Auflösung (Helpers für bookletDocs)
// ---------------------------------------------------------------------------

const resolveRef = (ref, schema) => {
  if (!ref) return null;

  // Unterstützung für die ausgelagerte adaptive-config.json
  if (ref.startsWith('adaptive-config.json')) {
    const adaptiveSchema = readAdaptiveSchema();
    if (ref === 'adaptive-config.json') return adaptiveSchema;
    const internalPart = ref.replace('adaptive-config.json#/', '');
    const parts = internalPart.split('/');
    return parts.reduce((node, part) => (node ? node[part] : null), adaptiveSchema);
  }

  if (!ref.startsWith('#/')) return null;
  const parts = ref.replace('#/', '').split('/');
  return parts.reduce((node, part) => (node ? node[part] : null), schema);
};

const resolve = (prop, schema) => {
  if (prop.$ref) return { ...resolveRef(prop.$ref, schema), ...prop, $ref: undefined };
  return prop;
};

// Hilfsfunktion zur Erzeugung valider HTML/Markdown-Anker-IDs aus Texten
const createAnchor = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---------------------------------------------------------------------------
// Markdown-Rendering-Komponenten
// ---------------------------------------------------------------------------

const renderDeprecation = prop => {
  if (!prop.deprecated) return '';
  const note = prop.deprecationNote ?? 'Dieser Parameter sollte nicht mehr verwendet werden.';
  return `\n> ⚠️ **Veraltet:** ${note}\n\n`;
};

const renderTypeBadge = prop => {
  if (prop.enum) return '`enum`';
  if (prop.type) return `\`${prop.type}\``;
  return '';
};

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

const renderRef = (ref, targetFile = '') => {
  if (!ref) return '';

  // Bestimme den reinen Definitionsnamen aus dem Pfad
  const name = ref.replace('#/$defs/', '').replace('adaptive-config.json#/$defs/', '');

  // Zentrales Wörterbuch für lesbare Namen
  const inlineMapping = {
    FirstTestlet: 'Testlet (Hauptblock / Startabschnitt)',
    Testlet: 'Testlet (Abschnitt / Block)',
    StateDefinition: 'State',
    OptionType: 'Option',
    Condition: 'If',
    Comparison: 'Is',
    VariableReference: 'Variable Referenz',
    VariableAggregation: 'Variable Aggregation'
  };

  const cleanName = inlineMapping[name] || name;
  const anchorId = createAnchor(cleanName);

  // Wenn auf eine externe Datei verwiesen wird (z.B. aus der booklet.md heraus in die adaptive-config.html)
  if (ref.startsWith('adaptive-config.json')) {
    return ` → Siehe Abschnitt: [${cleanName}](adaptive-config.html#${anchorId})`;
  }

  // Interner Link auf derselben Seite
  return ` → Siehe Abschnitt: [${cleanName}](${targetFile}#${anchorId})`;
};

const renderProperty = (key, prop, schema, requiredList = [], parentPath = '', forcedRef = null) => {
  const resolved = resolve(prop, schema);
  const isRequired = requiredList.includes(key);
  const isDeprecated = resolved.deprecated === true;
  const currentPath = parentPath ? `${parentPath}.${key}` : key;

  const badges = [];
  const typeBadge = renderTypeBadge(resolved);
  if (typeBadge) badges.push(typeBadge);
  if (isRequired) badges.push('`Pflichtfeld`');
  if (isDeprecated) badges.push('⚠️ *deprecated*');

  const badgeString = badges.length > 0 ? ` (${badges.join(' • ')})` : '';
  let result = `### ▪ \`${currentPath}\`${badgeString}\n\n`;

  result += renderDeprecation(resolved);
  const desc = resolved.description ?? resolved.title ?? '';
  if (desc) result += `${desc}\n`;

  result += renderDefaultAndExamples(resolved);
  result += renderEnumList(resolved);

  if (resolved.type === 'array' && resolved.items?.anyOf) {
    const refs = resolved.items.anyOf.map(item => renderRef(item.$ref)).join(', ');
    result += `\nTyp: Array aus Elementen von${refs}\n`;
  } else if (resolved.type === 'array' && resolved.items?.$ref) {
    result += `\nTyp: Array aus ${renderRef(resolved.items.$ref)}\n`;
  }

  const refToRender = forcedRef || prop.$ref;
  if (refToRender && resolved.type !== 'array' && !resolved.enum) {
    result += `\nStruktur: ${renderRef(refToRender)}\n`;
  }

  result += '\n';
  return result;
};

const renderPropertiesList = (properties, schema, required = [], parentPath = '') => {
  let result = '';
  Object.keys(properties).forEach(key => {
    const originalProp = properties[key];
    const originalRef = originalProp ? originalProp.$ref : null;

    if (originalProp && originalProp.description) {
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
// Sektions-Renderer für Booklet-Schema
// ---------------------------------------------------------------------------

const renderMetadata = (schema, current) => {
  let result = current;
  result += '\n';
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

const renderConfigRef = (schema, current) => {
  let result = current;
  result += '\n## BookletConfig (optional)\n\n';
  result += `${schema.properties.config.description}\n`;
  result += '\n→ Siehe [Booklet-Konfiguration](booklet-config.html)\n';
  return result;
};

const renderStates = (schema, current) => {
  let result = current;
  if (!schema.properties.states) return result;
  result += '\n## States (optional)\n\n';
  result += `${schema.properties.states.description}\n`;
  result += '\n→ Siehe [Booklet-Adaptives Testen](adaptive-config.html)\n';
  return result;
};

const renderUnits = (schema, current) => {
  let result = current;
  result += '\n## Units \n\n';
  result += `${schema.properties.units.description}\n`;
  result += `\nStruktur: ${renderRef(schema.properties.units.$ref)}\n`;
  return result;
};

const renderDefs = (schema, current) => {
  let result = current;
  result += '\n---\n';
  result += '# Kinderelemente\n\n';
  result += '> Hier werden die Attribute der Kinderelemnente beschrieben.\n\n';

  const nameMapping = {
    FirstTestlet: 'Testlet (Hauptblock / Startabschnitt)',
    Testlet: 'Testlet (Abschnitt / Block)'
  };

  Object.keys(schema.$defs || {}).forEach(defName => {
    if (defName === 'BookletConfig') return;

    const def = schema.$defs[defName];
    const cleanName = nameMapping[defName] || defName;
    const anchorId = createAnchor(cleanName);

    // Expliziter HTML-Anker wird vor die Überschrift gesetzt, damit die Markdown-Verlinkung plattformunabhängig greift
    result += `\n<a id="${anchorId}"></a>\n### ${cleanName}\n\n`;

    if (def.description) result += `${def.description}\n\n`;

    if (def.properties) {
      const cleanShortName = cleanName.split(' ')[0];
      result += renderPropertiesList(def.properties, schema, def.required ?? [], cleanShortName);
    }
    result += '\n';
  });

  return result;
};

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

// ---------------------------------------------------------------------------
// Gulp-Task: Adaptive-Config
// ---------------------------------------------------------------------------
exports.adaptiveConfig = done => {
  cliPrint.headline('AdaptiveConfig: Appending clean schema definitions to source MD');

  let output = fs.readFileSync(`${docsDir}/src/adaptive-config.md`, 'utf8').toString();
  const adaptiveSchema = readAdaptiveSchema();

  const nameMapping = {
    StateDefinition: 'State',
    OptionType: 'Option',
    Condition: 'If',
    Comparison: 'Is',
    VariableReference: 'Variable Referenz',
    VariableAggregation: 'Variable Aggregation'
  };

  Object.keys(adaptiveSchema.$defs || {}).forEach(defName => {
    const def = adaptiveSchema.$defs[defName];
    const cleanName = nameMapping[defName] || defName;
    const anchorId = createAnchor(cleanName);

    output += `\n<a id="${anchorId}"></a>\n## ${cleanName}\n`;

    if (def.description) output += `*${def.description}*\n\n`;

    if (def.properties) {
      const cleanShortName = cleanName.split(' ')[0];
      output += renderPropertiesList(def.properties, adaptiveSchema, def.required ?? [], cleanShortName);
    }
    output += '\n';
  });

  fs.writeFileSync(`${docsDir}/pages/adaptive-config.md`, output, 'utf8');
  done();
};

// ---------------------------------------------------------------------------
// Native Booklet-Schema Tasks
// ---------------------------------------------------------------------------

const bookletFile = `${docsDir}/pages/booklet.md`;
const readFile = filePath => (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '');
const writeFile = (filePath, content) => fs.writeFileSync(filePath, content, 'utf8');

exports.bookletHeader = done => {
  cliPrint.headline('Booklet: Writing header');
  const base = fs.readFileSync(`${docsDir}/src/booklet.md`, 'utf8');
  writeFile(bookletFile, base);
  done();
};

exports.bookletMetadata = done => {
  cliPrint.headline('Booklet: Writing metadata section');
  const schema = readMainSchema();
  writeFile(bookletFile, renderMetadata(schema, readFile(bookletFile)));
  done();
};

exports.bookletConfigRef = done => {
  cliPrint.headline('Booklet: Writing config reference section');
  const schema = readMainSchema();
  writeFile(bookletFile, renderConfigRef(schema, readFile(bookletFile)));
  done();
};

exports.bookletStates = done => {
  cliPrint.headline('Booklet: Writing states section');
  const schema = readMainSchema();
  writeFile(bookletFile, renderStates(schema, readFile(bookletFile)));
  done();
};

exports.bookletUnits = done => {
  cliPrint.headline('Booklet: Writing units section');
  const schema = readMainSchema();
  writeFile(bookletFile, renderUnits(schema, readFile(bookletFile)));
  done();
};

exports.bookletDefs = done => {
  cliPrint.headline('Booklet: Writing $defs section');
  const schema = readMainSchema();
  writeFile(bookletFile, renderDefs(schema, readFile(bookletFile)));
  done();
};

exports.bookletDocs = gulp.series(
  exports.bookletConfig,
  exports.adaptiveConfig,
  exports.bookletHeader,
  exports.bookletMetadata,
  exports.bookletConfigRef,
  exports.bookletStates,
  exports.bookletUnits,
  exports.bookletDefs
);
