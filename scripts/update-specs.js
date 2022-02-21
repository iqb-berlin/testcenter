/* eslint-disable no-console,import/no-extraneous-dependencies */
const fs = require('fs');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const YAML = require('yamljs');
const cliPrint = require('./helper/cli-print');
const jsonTransform = require('./helper/json-transformer');
const packageJson = require('../package.json');

gulp.task('compile_spec_files', () => {
  cliPrint.headline('compile spec files to one');
  return gulp.src('../docs/src/api/*.spec.yml')
    .on('data', d => { console.log(`File: ${d.path}`); })
    .on('error', e => { console.warn(e); })
    .pipe(yamlMerge('compiled.specs.yml'))
    .on('error', e => { console.warn(e); })
    .pipe(gulp.dest('./tmp/'));
});

gulp.task('update_docs', done => {
  cliPrint.headline('write compiled spec to docs folder');

  const compiledFileName = 'tmp/compiled.specs.yml';
  const targetFileName = '../docs/dist/api/specs.yml';
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
});

gulp.task('update_sample_files', done => {
  cliPrint.headline('Update sample files');

  const regex = /xsi:noNamespaceSchemaLocation="[^"]+\/definitions\/v?o?_?(\S*).xsd"/gm;
  const reference = `xsi:noNamespaceSchemaLocation="${packageJson.iqb.defintionsUrl}/${packageJson.version}/definitions/vo_$1.xsd"`;

  fs.readdirSync('../sampledata').forEach(file => {
    if (file.includes('.xml')) {
      console.log(`updating: ${file}`);
      const fileContents = fs.readFileSync(`../sampledata/${file}`);
      const newContents = fileContents.toString().replace(regex, reference);
      fs.writeFileSync(`../sampledata/${file}`, newContents);
    }
  });

  done();
});

exports.update_specs = gulp.series(
  'compile_spec_files',
  'update_docs',
  'update_sample_files'
);
