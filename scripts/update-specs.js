/* eslint-disable no-console */

/**
 * Creates the documentation of the Backend-API. It's a Package called Redoc, which takes the API-sepcs in OpenApi3
 * format and makes HTML out of it.
 *
 * See more documentation at the bottom of this file.
 */

const fs = require('fs');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const YAML = require('yamljs');
const fsExtra = require('fs-extra');
const cliPrint = require('./helper/cli-print');
const jsonTransform = require('./helper/json-transformer');
const packageJson = require('../package.json');

const tmpDir = fs.realpathSync(`${__dirname}'/../tmp`);
const docsDir = fs.realpathSync(`${__dirname}'/../docs`);

exports.mergeSpecFiles = (selector = 'api/*.spec.yml') => (() => {
  cliPrint.headline(`compile spec files to one selector: ${selector}`);
  return gulp.src(`${docsDir}/${selector}`)
    .on('data', d => { console.log(`File: ${d.path}`); })
    .on('error', e => { console.warn(e); })
    .pipe(yamlMerge('compiled.specs.yml'))
    .on('error', e => { console.warn('error', e); })
    .pipe(gulp.dest(tmpDir));
});

const prepareDocsDestinationFolder = done => {
  cliPrint.headline('Prepare destination Folder');

  if (!fs.existsSync(`${docsDir}/dist/api`)) {
    fs.mkdirSync(`${docsDir}/dist/api`);
  }
  fs.copyFileSync(`${docsDir}/api/index.html`, `${docsDir}/dist/api/index.html`);
  done();
};

const updateDocs = done => {
  cliPrint.headline('write compiled spec to docs folder');

  const compiledFileName = `${tmpDir}/compiled.specs.yml`;
  const targetFileName = `${docsDir}/dist/api/specs.yml`;
  const yamlTree = YAML.parse(fs.readFileSync(compiledFileName, 'utf8'));

  const localizeReference = (key, val) => {
    const referenceString = val.substring(val.lastIndexOf('#'));
    return {
      key: '$ref',
      val: referenceString
    };
  };

  const replaceVersion = (key, val) => ({
    key: 'version',
    val: (val === '%%%VERSION%%%') ? packageJson.version : val
  });

  const makeRedocCompatible = {
    'schema > \\$ref$': localizeReference,
    'items > \\$ref$': localizeReference,
    '> version$': replaceVersion
  };

  const transformed = jsonTransform(yamlTree, makeRedocCompatible, false);
  const transformedAsString = YAML.stringify(transformed, 10);
  fs.writeFileSync(targetFileName, transformedAsString, 'utf8');

  done();
};

exports.clearTmpDir = done => {
  cliPrint.headline('clear tmp dir');

  fsExtra.emptyDirSync(tmpDir);
  done();
};

/**
 * To be more manageable the specs are distributed over several files in `docs/src/api`.
 * This takes the files and merges them together as needed by ReDoc. Also OpenApi3 is not OpenApi3.
 * While the specs are written in Standard OpenApi3, on both use-cases, Dredd and ReDoc,
 * some special treatment is needed.
 * This places the API-Page and the compiled, Re-Docs-compatible specs into the docs folder.
 */
exports.updateSpecs = gulp.series(
  exports.clearTmpDir,
  prepareDocsDestinationFolder,
  exports.mergeSpecFiles(),
  updateDocs
);
