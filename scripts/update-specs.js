/* eslint-disable no-console,import/no-extraneous-dependencies */
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
const sampledataDir = fs.realpathSync(`${__dirname}'/../sampledata`);

exports.mergeSpecFiles = () => {
  cliPrint.headline('compile spec files to one');
  return gulp.src(`${docsDir}/src/api/*.spec.yml`)
    .on('data', d => { console.log(`File: ${d.path}`); })
    .on('error', e => { console.warn(e); })
    .pipe(yamlMerge('compiled.specs.yml'))
    .on('error', e => { console.warn('error', e); })
    .pipe(gulp.dest(tmpDir));
};

exports.prepareDocsDestinationFolder = done => {
  cliPrint.headline('Prepare destination Folder');

  if (!fs.existsSync(`${docsDir}/dist/api`)) {
    fs.mkdirSync(`${docsDir}/dist/api`);
  }
  fs.copyFileSync(`${docsDir}/src/api/index.html`, `${docsDir}/dist/api/index.html`);
  done();
};

exports.updateDocs = done => {
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

exports.updateSampleFiles = done => {
  cliPrint.headline('Update sample files');

  const regex = /xsi:noNamespaceSchemaLocation="[^"]+\/definitions\/v?o?_?(\S*).xsd"/gm;
  const reference = `xsi:noNamespaceSchemaLocation="${packageJson.iqb.defintionsUrl}/${packageJson.version}/definitions/vo_$1.xsd"`;

  fs.readdirSync(sampledataDir).forEach(file => {
    if (file.includes('.xml')) {
      console.log(`updating: ${file}`);
      const fileContents = fs.readFileSync(`${sampledataDir}/${file}`);
      const newContents = fileContents.toString().replace(regex, reference);
      fs.writeFileSync(`${sampledataDir}/${file}`, newContents);
    }
  });

  done();
};

exports.clearTmpDir = done => {
  cliPrint.headline('clear tmp dir');

  fsExtra.emptyDirSync(tmpDir);
  done();
};

exports.updateSpecs = gulp.series(
  exports.clearTmpDir,
  exports.prepareDocsDestinationFolder,
  exports.mergeSpecFiles,
  exports.updateDocs
  // exports.updateSampleFiles
);
