/**
 * Generates the Markdown parts of the documentation which are derived from the definitions.
 * The pages in `site/pages` include them from `site/generated`.
 */

import fs from 'fs';
import { superStates } from '../../frontend/src/app/group-monitor/test-session/super-states.ts';

const definitionsDir = new URL('../../definitions/', import.meta.url);
const generatedDir = new URL('../site/generated/', import.meta.url);
const iconSprite = new URL('../../frontend/src/assets/icons/material-icons.svg', import.meta.url);

const readDefinition = path => JSON.parse(fs.readFileSync(new URL(path, definitionsDir), 'utf8'));

const bookletConfig = () => {
  const definition = readDefinition('booklet/booklet-config.json');
  return Object.entries(definition)
    .map(([name, param]) => {
      let output = `## \`${name}\`\n\n`;
      if (param.deprecated) {
        output += '::: warning Abgekündigt\n';
        output += 'Dieser Parameter sollte nicht mehr verwendet werden. Er wird in einer kommenden Version entfernt.\n';
        if (param.deprecationNote) {
          output += `\n${param.deprecationNote}\n`;
        }
        output += ':::\n\n';
      }
      output += `${param.label}\n\n`;
      if (param.options && Object.keys(param.options).length) {
        output += Object.entries(param.options)
          .map(([value, description]) => {
            const isDefault = (value === param.defaultvalue) ? '**' : '';
            return `* ${isDefault}"${value}" - ${description}${isDefault}\n`;
          })
          .join('');
      } else {
        output += `* **${param.defaultvalue}**\n`;
      }
      return output;
    })
    .join('\n');
};

const testMode = () => {
  const definition = readDefinition('testtaker/test-mode.json');
  const modeOptions = readDefinition('testtaker/mode-options.json');
  const modes = Object.keys(definition);
  let output = '## Verfügbare Modi\n\n';
  output += modes
    .map(mode => `* \`${mode}\`${mode === 'RUN-DEMO' ? ' (default)' : ''}: ${definition[mode].label}\n`)
    .join('');
  output += '\n## Merkmale der Modi im Vergleich\n\n';
  output += `| Merkmal / Option |${modes.map(mode => ` \`${mode}\` |`).join('')}\n`;
  output += `| :--- |${modes.map(() => ' :---: |').join('')}\n`;
  output += Object.entries(modeOptions)
    .map(([option, label]) => `| ${label} |${modes.map(mode => (definition[mode].config[option] ? ' ✅ |' : '  |')).join('')}\n`)
    .join('');
  return output;
};

const CUSTOM_TEXT_GROUPS = [
  { prefix: 'login_', title: 'Anmeldeseite (`login_*`)', description: 'Texte für die Anmeldeseite und allgemeine UI-Elemente.' },
  { prefix: 'booklet_', title: 'Testheft-Ansicht (`booklet_*`)', description: 'Texte für die Testheft-Ansicht, Navigation und Dialoge.' },
  { prefix: 'syscheck_', title: 'System-Check (`syscheck_*`)', description: 'Texte für den System-Check.' },
  { prefix: 'gm_', title: 'Gruppenmonitor (`gm_*`)', description: 'Texte für den Gruppenmonitor.' },
  { prefix: '', title: 'Sonstige', description: '' }
];

const customTexts = () => {
  const definition = readDefinition('testtaker/custom-texts.json');
  const groupOf = key => CUSTOM_TEXT_GROUPS.find(group => key.startsWith(group.prefix));
  return CUSTOM_TEXT_GROUPS
    .map(group => {
      const keys = Object.keys(definition)
        .filter(key => groupOf(key) === group)
        .sort();
      if (!keys.length) return '';
      let output = `## ${group.title}\n\n`;
      if (group.description) output += `${group.description}\n\n`;
      output += keys
        .map(key => `### \`${key}\`\n\n${definition[key].label}\n\nStandard: ${definition[key].defaultvalue}\n`)
        .join('\n');
      return output;
    })
    .filter(Boolean)
    .join('\n');
};

// colors of the classes in frontend/src/app/group-monitor/test-session/test-session.component.css
const SUPER_STATE_COLORS = {
  danger: '#821123',
  success: '#b2ff59'
};

const testSessionSuperStates = () => {
  const sprite = fs.readFileSync(iconSprite, 'utf8');
  const icon = (name, className) => {
    const symbol = sprite.match(new RegExp(`<symbol id="${name}"[^>]*viewBox="([^"]*)"[^>]*>([\\s\\S]*?)</symbol>`));
    if (!symbol) return '';
    const color = SUPER_STATE_COLORS[className] ? ` style="color: ${SUPER_STATE_COLORS[className]}"` : '';
    const paths = symbol[2].replace(/\s*\n\s*/g, '');
    return `<svg viewBox="${symbol[1]}" width="36" height="36" fill="currentColor"${color}>${paths}</svg>`;
  };
  const cell = text => (text || '').replace(/\|/g, '\\|');
  let output = '| Symbol | Zustand | Tooltip | Beschreibung |\n';
  output += '| :---: | :--- | :--- | :--- |\n';
  output += Object.entries(superStates)
    .map(([name, state]) => `| ${icon(state.icon, state.class)} | \`${name}\` | ${cell(state.tooltip)} | ${cell(state.description)} |\n`)
    .join('');
  return output;
};

const generators = {
  'booklet-config.md': bookletConfig,
  'test-mode.md': testMode,
  'custom-texts.md': customTexts,
  'test-session-super-states.md': testSessionSuperStates
};

fs.mkdirSync(generatedDir, { recursive: true });
Object.entries(generators)
  .forEach(([fileName, generate]) => {
    fs.writeFileSync(new URL(fileName, generatedDir), generate(), 'utf8');
  });
