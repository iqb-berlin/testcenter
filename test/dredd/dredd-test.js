/* eslint-disable no-console,import/no-extraneous-dependencies */
const fs = require('fs');
const Dredd = require('dredd');
const gulp = require('gulp');
const YAML = require('yamljs');
const inquirer = require('inquirer');
const cliPrint = require('../../scripts/helper/cli-print');
const jsonTransform = require('../../scripts/helper/json-transformer');
const { mergeSpecFiles, clearTmpDir } = require('../../scripts/update-specs');

const tmpDir = fs.realpathSync(`${__dirname}'/../../tmp`);

const apiUrl = process.env.TC_API_URL || 'http://localhost';
const specialTestConfig = fs.existsSync('../backend/config/e2eTests.json')
  ? JSON.parse(fs.readFileSync('../backend/config/e2eTests.json').toString())
  : false;

const confirmTestConfig = async done => {
  if (!apiUrl) {
    cliPrint.error('No API Url given!');
    return;
  }

  cliPrint.headline(`Running Dredd tests against API: ${apiUrl}`);

  if (process.env.ALLOW_REAL_DATA_MODE && (process.env.ALLOW_REAL_DATA_MODE === 'yes')) {
    cliPrint.error('You run this in REAL-DATA-MODE.');
    return;
  }

  if ((specialTestConfig !== false) && (typeof specialTestConfig.configFile !== 'undefined')) {
    inquirer.prompt([{
      type: 'confirm',
      message: cliPrint.get.error('You run this in REAL-DATA-MODE - that means you want '
        + 'to run tests against REAL database-configuration as defined in '
        + `config/DBConnectionData.${specialTestConfig.configFile}.json `
        + 'data folder as configured in `config/DBConnectionData.json`\n'
        + 'YOU WILL LOOSE ALL DATA IN DB AND FOLDER BY DOING THIS!!! '
        + '...you want to do this for real?\n'),
      default: false,
      name: 'start'
    }]).then(answers => {
      if (!answers.start) {
        cliPrint.error('Aborted.');
        done(new Error('Aborted'));
      } else {
        done();
      }
    });
  }
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
  cliPrint.headline(`run dredd against ${apiUrl}`);

  new Dredd({
    endpoint: apiUrl,
    path: [`${tmpDir}/transformed.specs.*.yml`],
    hookfiles: ['dredd-hooks.js'],
    output: [`${tmpDir}/report.html`],
    reporter: ['html'],
    names: false
  }).run((err, stats) => {
    console.log(stats);
    if (err) {
      console.log("1");
      console.log(err);
      done(new Error(cliPrint.get.error(`Dredd Tests: ${err}`)));
    }
    if (stats.errors + stats.failures > 0) {
      console.log("2");
      console.log(stats);
      done(new Error(
        cliPrint.get.error(`Dredd Tests: ${stats.failures} failed and ${stats.errors} finished with error.`)
      ));
    }
    done();
  });
};

const deleteSpecialConfigFile = done => {
  if (specialTestConfig) {
    try {
      fs.renameSync('../config/e2eTests.json', '../config/e2eTests.backup.json');
      cliPrint.error("Special test config file 'config/e2eTests.json' was renamed for security reasons!");
    } catch (exception) {
      cliPrint.error("Please delete config file 'config/e2eTests.json' for security reasons!");
    }
  }
  done();
};

exports.runDreddTest = gulp.series(
  confirmTestConfig,
  clearTmpDir,
  mergeSpecFiles,
  prepareSpecsForDredd,
  runDredd,
  deleteSpecialConfigFile
);
