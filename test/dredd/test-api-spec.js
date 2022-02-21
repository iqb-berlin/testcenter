const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const YAML = require('yamljs');
const inquirer = require('inquirer');
const cliPrint = require('./helper/cli-print');
const jsonTransform = require('./helper/json-transformer');
const composerFile = require('../composer.json');


const apiUrl = process.env.TC_API_URL || 'http://localhost';
const specialTestConfig = fs.existsSync('../config/e2eTests.json')
  ? JSON.parse(fs.readFileSync('../config/e2eTests.json').toString())
  : false;
const xsdUrl = "https://raw.githubusercontent.com/iqb-berlin/testcenter-backend";

// tasks

gulp.task('start', done => {

  if (!apiUrl) {
    done(cliPrint.getError("No API Url given!"));
  }

  cliPrint.headline(`Running Dredd tests against API: ${apiUrl}`);

  if (process.env.ALLOW_REAL_DATA_MODE && (process.env.ALLOW_REAL_DATA_MODE === 'yes')) {

      cliPrint.red('You run this in REAL-DATA-MODE');
      done();
      return;
  }

  if ((specialTestConfig !== false) && (typeof specialTestConfig.configFile !== "undefined")) {

    inquirer.prompt([{
      type: 'confirm',
      message: cliPrint.red('You run this in REAL-DATA-MODE - that means you want ' +
        'to run tests against REAL database-configuration as defined in' +
        `config/DBConnectionData.${specialTestConfig.configFile}.json` +
        'data folder as configured in `config/DBConnectionData.json`\n' +
        'YOU WILL LOOSE ALL DATA IN DB AND FOLDER BY DOING THIS!!!' +
        '...you want to do this for real?\n'),
      default: false,
      name: 'start'
    }]).then((answers) => {

      if (!answers.start) {
        done(cliPrint.getError("Aborted."));
      } else {
        done();
      }

    });

  } else {

    done();
  }
});

gulp.task('clear_tmp_dir', done => {

  cliPrint.headline("clear tmp dir");

  fsExtra.emptyDirSync('./tmp');
  done();
});



gulp.task('prepare_spec_for_dredd', done => {

  const compiledFileName = 'tmp/compiled.specs.yml';
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

  const resolveReference = (key, val) => {
    const referenceString = val.substring(val.lastIndexOf('/') + 1);
    return {
      key: null,
      val: specsJson.components.schemas[referenceString]
    }
  };

  const takeOnlyOneExample = (key, val, matches) => {
    iterations = Math.max(iterations, Object.keys(val).length);
    const currentExample = val[Object.keys(val)[iteration - 1]];
    if (typeof currentExample === "undefined") {
      return null;
    }
    splitPaths.push(matches[1]);
    return {
      key: "example",
      val: currentExample.value
    }
  };

  const makeDreddCompatible = {
    "^(paths > [^> ]+ > [^> ]+) > .*? > examples$": takeOnlyOneExample,
    "^info > title$": 'specs',
    "parameters > \\d+ > schema$": null,
    "text/xml > example$": null,
    "application/octet-stream > example$": null,
    "^paths > .*? > .*? > responses > (500|202)$": null,
    "schema > \\$ref$": resolveReference,
    "items > \\$ref$": resolveReference,
    "deprecated": null,
    "properties > .*? > format": null,
    "^(paths > [^> ]+ > [^> ]+) > tags$": null,
  };

  const deleteAllPathsButSplit = {
    "^(paths > [^> ]+ > [^> ]+)$": (key, val, matches) => {
      if (splitPaths.indexOf(matches[1]) > -1) {
        return { key, val };
      }
      return null;
    }
  }

  const specsJson = YAML.parse(fs.readFileSync(compiledFileName, "utf8"));

  let iterations = 1;
  let iteration = 0;
  let splitPaths = [];
  while (iteration++ < iterations) {
    splitPaths = [];
    const targetFileName = `tmp/transformed.specs.${iteration}.yml`;
    let transformedSpecsJson = jsonTransform(specsJson, makeDreddCompatible);
    if (iteration > 1) {
      transformedSpecsJson = jsonTransform(transformedSpecsJson, deleteAllPathsButSplit);
    }
    fs.writeFileSync(targetFileName, YAML.stringify(transformedSpecsJson, 10), "utf8");
    console.log(`${iteration}/${iterations}: ${targetFileName} written.`);
  }

  done();
});

gulp.task('run_dredd', done => {

  cliPrint.headline(`run dredd against ${apiUrl}`);

  new Dredd({
    endpoint: apiUrl,
    path: ['tmp/transformed.specs.*.yml'],
    hookfiles: ['dredd-hooks.js'],
    output: [`tmp/report.html`],
    reporter: ['html'],
    names: false,
  }).run((err, stats) => {
    console.log(stats);
    if (err) {
      done(cliPrint.getError(`Dredd Tests: ` + err));
    }
    if (stats.errors + stats.failures > 0) {
      done(cliPrint.getError(`Dredd Tests: ${stats.failures} failed and ${stats.errors} finished with error.`));
    }
    done();
  });
});





gulp.task('delete_special_config_file', done => {

  if (specialTestConfig) {

    try  {

      fs.renameSync('../config/e2eTests.json', '../config/e2eTests.backup.json');
      console.log(cliPrint.red("Special test config file 'config/e2eTests.json' was renamed for security reasons!"));

    } catch (exception) {

      console.log(cliPrint.red("Please delete config file 'config/e2eTests.json' for security reasons!"));
    }
  }

  done();
});


exports.run_dredd_test = gulp.series(
  'start',
  'clear_tmp_dir',
  'compile_spec_files',
  'prepare_spec_for_dredd',
  'run_dredd',
  'delete_special_config_file',
  'update_docs',
  'update_sample_files'
);

exports.repeat = gulp.series(
  'run_dredd',
  'delete_special_config_file',
);

exports.run_dredd_test_no_specs = gulp.series(
  'start',
  'clear_tmp_dir',
  'compile_spec_files',
  'prepare_spec_for_dredd',
  'run_dredd',
  'delete_special_config_file',
);

exports.update_specs = gulp.series(
  'start',
  'compile_spec_files',
  'update_docs',
  'update_sample_files'
);
