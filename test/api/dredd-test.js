/* eslint-disable no-console,import/no-extraneous-dependencies,implicit-arrow-linebreak,function-paren-newline */
const fs = require('fs');
const Dredd = require('dredd');
const gulp = require('gulp');
const YAML = require('yamljs');
const request = require('request');
const cliPrint = require('../../scripts/helper/cli-print');
const jsonTransform = require('../../scripts/helper/json-transformer');
const testcenterConfig = require('./config/dredd_test_config.json'); // TODO use the same source as environment.ts and don't check it in
const { mergeSpecFiles, clearTmpDir } = require('../../scripts/update-specs');

const tmpDir = fs.realpathSync(`${__dirname}'/../../tmp`);

const apiUrl = process.env.TC_API_URL || testcenterConfig.testcenterUrl;

const confirmTestConfig = async done => {
  if (!apiUrl) {
    return done(new Error(cliPrint.get.error('No API Url given!')));
  }

  const getStatus = () => new Promise(resolve =>
    request(`${apiUrl}/system/config`, (error, response) => resolve(!response ? -1 : response.statusCode))
  );

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  cliPrint.headline(`Running Dredd tests against API: ${apiUrl}`);

  let retries = 10;
  let status = 0;
  // eslint-disable-next-line no-plusplus
  while ((status !== 200) && retries--) {
    // eslint-disable-next-line no-await-in-loop
    status = await getStatus();
    if (status === 200) {
      return done();
    }
    console.log(`Connection attempt failed; ${retries} retries left`);
    // eslint-disable-next-line no-await-in-loop
    await sleep(5000);
  }

  return done(new Error(cliPrint.get.error(`Could not connect to ${apiUrl}`)));
};

const prepareSpecsForDredd = done => {
  const compiledFileName = `${tmpDir}/compiled.specs.yml`;
  cliPrint.headline(`Creating Dredd-compatible API-spec version from ${compiledFileName}`);

  /**
   * Before testing the standard OpenApi3-file have to be manipulated:
   * * dredd does not support multiple examples, so we generate multiple spec files for dredd.
   *   The first contains everything and the first example each if multiple are given,
   *   the subsequent ones only the paths with left out examples
   * * Dredd supports only in-file-references
   * * For more quirks of Dredd see:
   *   @see https://github.com/apiaryio/api-elements.js/blob/master/packages/fury-adapter-oas3-parser/STATUS.md
   * * [500] Server errors get not tested (how could that be)
   * * [202] get not tested // TODO why? is this necessary
   */

  const specsJson = YAML.parse(fs.readFileSync(compiledFileName, 'utf8'));
  let iterations = 1;
  let iteration = 0;
  let splitPaths = [];

  const resolveReference = (key, val) => {
    const referenceString = val.substring(val.lastIndexOf('/') + 1);
    return {
      key: null,
      val: specsJson.components.schemas[referenceString]
    };
  };

  const takeOnlyOneExample = (key, val, matches) => {
    iterations = Math.max(iterations, Object.keys(val).length);
    const currentExample = val[Object.keys(val)[iteration - 1]];
    if (typeof currentExample === 'undefined') {
      return null;
    }
    splitPaths.push(matches[1]);
    return {
      key: 'example',
      val: currentExample.value
    };
  };

  const makeDreddCompatible = {
    '^(paths > [^> ]+ > [^> ]+) > .*? > examples$': takeOnlyOneExample,
    '^info > title$': 'specs',
    'parameters > \\d+ > schema$': null,
    'text/xml > example$': null,
    'application/octet-stream > example$': null,
    '^paths > .*? > .*? > responses > (500|202)$': null,
    'schema > \\$ref$': resolveReference,
    'items > \\$ref$': resolveReference,
    deprecated: null,
    'properties > .*? > format': null,
    '^(paths > [^> ]+ > [^> ]+) > tags$': null
  };

  const deleteAllPathsButSplit = {
    '^(paths > [^> ]+ > [^> ]+)$': (key, val, matches) => {
      if (splitPaths.indexOf(matches[1]) > -1) {
        return { key, val };
      }
      return null;
    }
  };

  // eslint-disable-next-line no-plusplus
  while (iteration++ < iterations) {
    splitPaths = [];
    const targetFileName = `${tmpDir}/transformed.specs.${iteration}.yml`;
    let transformedSpecsJson = jsonTransform(specsJson, makeDreddCompatible);
    if (iteration > 1) {
      transformedSpecsJson = jsonTransform(transformedSpecsJson, deleteAllPathsButSplit);
    }
    fs.writeFileSync(targetFileName, YAML.stringify(transformedSpecsJson, 10), 'utf8');
    console.log(`${iteration}/${iterations}: ${targetFileName} written.`);
  }

  done();
};

const runDredd = async done => {
  cliPrint.headline(`Run Dredd against ${apiUrl}`);

  new Dredd({
    endpoint: apiUrl,
    path: [`${tmpDir}/transformed.specs.*.yml`],
    hookfiles: ['dredd-hooks.js'],
    output: [`${tmpDir}/report.html`], // TODO 13
    reporter: ['html'],
    names: false
  }).run((err, stats) => {
    console.log(stats);
    if (err) {
      done(new Error(cliPrint.get.error(`Dredd Tests: ${err}`)));
    }
    if (stats.errors + stats.failures > 0) {
      done(new Error(
        cliPrint.get.error(`Dredd Tests: ${stats.failures} failed and ${stats.errors} finished with error.`)
      ));
    }
    done();
  });
};

exports.runDreddTest = gulp.series(
  confirmTestConfig,
  clearTmpDir,
  mergeSpecFiles,
  prepareSpecsForDredd,
  runDredd
);
