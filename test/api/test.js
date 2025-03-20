/* eslint-disable no-console,import/no-extraneous-dependencies,implicit-arrow-linebreak,function-paren-newline */
const fs = require('fs');
const Dredd = require('dredd');
const gulp = require('gulp');
const redis = require('redis');
const YAML = require('yamljs');
const request = require('request');
const cliPrint = require('../../scripts/helper/cli-print');
const jsonTransform = require('../../scripts/helper/json-transformer');
const testConfig = require('../config.json');
const { mergeSpecFiles, clearTmpDir } = require('../../scripts/update-specs');

const tmpDir = fs.realpathSync(`${__dirname}'/../../tmp`);

const getStatus = statusRequest => new Promise(resolve => {
  const startTime = Date.now();
  request(statusRequest, (error, response, body) => {
    if (error) {
      console.log(`ConfirmTestConfig: The StatusRequest errored after ${Date.now() - startTime}ms`);
      console.log('Requested status results in error: ', error);
      console.log('Requested status: ', statusRequest);
      console.log('Body of errored request: ', body);
      resolve(error);
    } else {
      console.log(`ConfirmTestConfig: The StatusRequest got a response back after ${Date.now() - startTime}ms`);
      resolve(response);
    }
  }
  );
});

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const confirmTestConfig = (serviceUrl, statusRequest) => (async done => {
  if (!serviceUrl) {
    throw new Error(cliPrint.get.error('No API Url given!'));
  }

  cliPrint.headline(`Running Dredd tests against service: ${serviceUrl}`);

  let retries = 10;
  let statusCode = 0;
  // eslint-disable-next-line no-plusplus
  while ((statusCode !== 200) && retries--) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await getStatus(statusRequest);
      statusCode = response.statusCode;
      if (statusCode === 200) {
        return done();
      }
      console.log(`Response has a statuscode ${statusCode} (${retries} retries left): `);
      console.log(response.body);
      console.log('request tried: ');
      console.log(statusRequest);
      // eslint-disable-next-line no-await-in-loop
      await sleep(5000);
    } catch (e) {
      await sleep(5000);
    }
  }

  throw new Error(cliPrint.get.error(`Could not connect to ${serviceUrl}`));
});

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
   * * Some cases are not tested:
   * * * [500] (server error)
   * * * [202] (no content) // TODO: add test-account with no workspaces for this test
   * * * [429] (too many requests) // can not be created with only one call
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
    '^paths > .*? > .*? > responses > (500|202|429)$': null,
    'schema > \\$ref$': resolveReference,
    'items > \\$ref$': resolveReference,
    deprecated: null,
    'properties > .*? > format': null,
    'schema > format': null,
    '^(paths > [^> ]+ > [^> ]+) > tags$': null,
    'responses > .*? > headers > .*? > description': null,
    'responses > .*? > headers > .*? > schema': null
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

const runDredd = serviceUrl => (async done => {
  cliPrint.headline(`Run API-test against ${serviceUrl}`);
  new Dredd({
    endpoint: serviceUrl, // your URL to API endpoint the tests will run against
    path: [`${tmpDir}/transformed.specs.*.yml`], // Required Array if Strings; filepaths to API description documents, can use glob wildcards
    'dry-run': false, // Boolean, do not run any real HTTP transaction
    names: false, // Boolean, Print Transaction names and finish, similar to dry-run
    loglevel: 'debug', // String, logging level (debug, warning, error, silent)
    only: [], // Array of Strings, run only transaction that match these names
    header: [], // Array of Strings, these strings are then added as headers (key:value) to every transaction
    user: null, // String, Basic Auth credentials in the form username:password
    hookfiles: ['hooks.js'], // Array of Strings, filepaths to files containing hooks (can use glob wildcards)
    reporter: ['html'], // Array of possible reporters, see folder lib/reporters
    output: [`${tmpDir}/report.html`], // Array of Strings, filepaths to files used for output of file-based reporters
    'inline-errors': true, // Boolean, If failures/errors are display immediately in Dredd run
    require: null, // String, When using nodejs hooks, require the given module before executing hooks
    // color: false
    // emitter: new EventEmitter(), // listen to test progress, your own instance of EventEmitter
    // apiDescriptions: ['FORMAT: 1A\n# Sample API\n']
  }).run((err, stats) => {
    console.log(stats);
    if (err) {
      throw new Error(cliPrint.get.error(`Dredd Tests: ${err}`));
    }
    if (stats.errors + stats.failures > 0) {
      throw new Error(cliPrint.get.error(`Dredd Tests: ${stats.failures} failed and ${stats.errors} finished with error.`));
    }
    done();
  });
});

const insertGroupTokenToCacheService = async () => {
  cliPrint.headline('Inject group-token into cache');
  const client = redis.createClient({ url: 'redis://testcenter-cache-service' });
  await client.connect();
  await client.set('group-token:static:group:sample_group', 1, { EX: 60 });
  await client.quit();
};

exports.runDreddTest = gulp.series(
  // confirmTestConfig(
  //   testConfig.backend_url, {
  //     url: `${testConfig.backend_url}/system/config?XDEBUG_SESSION_START=IDEA`,
  //     headers: {
  //       TestMode: 'prepare'
  //     },
  //     timeout: 300000 // 5 minutes
  //   }
  // ),
  clearTmpDir,
  mergeSpecFiles('api/*.spec.yml'),
  prepareSpecsForDredd,
  runDredd(testConfig.backend_url)
);

exports.runDreddTestFs = gulp.series(
  // confirmTestConfig(
  //   testConfig.file_service_url,
  //   {
  //     url: `${testConfig.file_service_url}/health`,
  //     timeout: 300000 // 5 minutes
  //   }
  // ),
  clearTmpDir,
  mergeSpecFiles('api/file.spec.yml'),
  prepareSpecsForDredd,
  insertGroupTokenToCacheService,
  runDredd(testConfig.file_service_url)
);
