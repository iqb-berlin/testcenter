/* eslint-disable no-console,no-restricted-syntax */
// analysis of source code (html, ts):
// listing of all used keys for customText

const fs = require("fs");

const definitionFilename = '../app/config/custom-texts.json';
const startFolder = '../app';
const mdSourceFilename = '../app/config/custom-texts.md';
const mdTargetFilename = '../../docs/custom-texts.md';

const foundKeys = {};
const foundSourceFiles = [];
const foundDefaults = {};
let foundError = false;

function analyse(fileName, isHtml) {
  const fileContent = fs.readFileSync(fileName, 'utf8').toString();

  const searchPattern = isHtml ?
    /["'`]([^"'`]+)["'`]\s*\|\s*customtext:\s*["'`](\w+)["'`]/g :
    /(getCustomText)\(\s*["'`](\w+)["'`]/g;
  let matches = fileContent.matchAll(searchPattern);

  for (const match of matches) {
    if (foundSourceFiles.indexOf(fileName) === -1) {
      foundSourceFiles.push(fileName);
    }
    const foundKey = match[2];
    const foundDefault = isHtml ? match[1] : '(none)';
    if (foundKeys[foundKey]) {
      foundKeys[foundKey] += 1;
      foundDefaults[foundKey].push(foundDefault);
    } else {
      foundKeys[foundKey] = 1;
      foundDefaults[foundKey] = [foundDefault];
    }
  }
}

function takeFolder(sourceFolder) {
  const dirEntries = fs.readdirSync(sourceFolder);
  for (let i = 0; i < dirEntries.length; i++) {
    const fullObjectName = sourceFolder + '/' + dirEntries[i];
    const stats = fs.statSync(fullObjectName);
    if (stats.isDirectory()) {
      takeFolder(fullObjectName);
    } else if (stats.isFile()) {
      const dotPos = fullObjectName.lastIndexOf('.');
      if (dotPos > 0) {
        const fileExtension = fullObjectName.substr(dotPos + 1);
        if (fileExtension.toUpperCase() === 'TS') {
          analyse(fullObjectName, false);
        } else if (fileExtension.toUpperCase() === 'HTML') {
          analyse(fullObjectName, true);
        }
      }
    }
  }
}

takeFolder(startFolder);

const defaults = JSON.parse(fs.readFileSync(definitionFilename));

console.log();
console.log('\x1b[33m%s\x1b[0m', 'used keys:');
for (const k of Object.keys(foundKeys)) {
  if (defaults[k]) {
    console.log(`${k}: ${foundKeys[k]}`);
    console.log(` - [${defaults[k].defaultvalue}]`);
  } else {
    foundError = true;
    console.log('\x1b[31m%s\x1b[0m', `${k}: ${foundKeys[k]}`);
  }
  console.log(` - ${foundDefaults[k].join('\n - ')}`);
}

console.log();
console.log('\x1b[33m%s\x1b[0m', 'found in:');
for (const f of foundSourceFiles) {
  console.log(`  ${f}`);
}

console.log();
console.log('\x1b[33m%s\x1b[0m', 'not used:');
for (const k of Object.keys(defaults).sort()) {
  if (!foundKeys[k]) {
    console.log(`${k}`);
  }
}

if (!foundError) {
  console.log('');
  console.log('writing markdown');
  let mdContent = fs.readFileSync(mdSourceFilename, 'utf8').toString();
  for (const k of Object.keys(defaults).sort()) {
    mdContent += '|`' + k + '`|' + defaults[k].label + '|' + defaults[k].defaultvalue + '|' + '\n';
  }
  fs.writeFileSync(mdTargetFilename, mdContent, "utf8");
}

console.log('');
console.log('done.');
