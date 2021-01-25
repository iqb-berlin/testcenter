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

  if ((specialTestConfig !== false) && (typeof specialTestConfig.configFile !== "undefined")) {

    inquirer.prompt([{
      type: 'confirm',
      message: cliPrint.red('You run this in REAL-DATA-MODE - that means you want ' +
        'to run tests against REAL database-configuration as defined in' +
        `config/DBConnectionData.${specialTestConfig.configFile}.json` +
        'data folder as configured in `config/DBConnectionData.json`\n' +
        'YOU WILL LOOSE ALL DATA IN DB AND FOLDER BY DOING THIS!!!' +
        '...you want to do this for real?'),
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

gulp.task('compile_spec_files', function() {

  cliPrint.headline(`compile spec files to one`);

  return gulp.src(`../routes/*.spec.yml`)
    .on("data", (d) => { console.log("File: " + d.path);})
    .on("error", (e) => { console.warn(e);})
    .pipe(yamlMerge('compiled.specs.yml'))
    .on("error", (e) => { console.warn(e);})
    .pipe(gulp.dest('./tmp/'));
});

gulp.task('prepare_spec_for_dredd', done => {

  const compiledFileName = 'tmp/compiled.specs.yml';
  cliPrint.headline(`Creating Dredd-compatible API-spec version from ${compiledFileName}`);

  const yamlString = fs.readFileSync(compiledFileName, "utf8");
  const yamlTree = YAML.parse(yamlString);

  const resolveReference = (key, val) => {
    const referenceString = val.substring(val.lastIndexOf('/') + 1);
    return {
      key: null,
      val: yamlTree.components.schemas[referenceString]
    }
  };

  const splitExamples = (key, val) => {

    iterations = Math.max(iterations, Object.keys(val).length);
    const currentExample = val[Object.keys(val)[iteration - 1]];
    return (typeof currentExample === "undefined") ? null : {
      key: "example",
      val: currentExample.value
    }
  };

  let iterations = 1;
  let iteration = 0;
  let deletePaths;

  // @see https://github.com/apiaryio/api-elements.js/blob/master/packages/fury-adapter-oas3-parser/STATUS.md
  const rules = {
    "^(paths > .*? > .*?) .*? > example$": (key, val, matches, trace) => {
      if ((iteration > 1) && (trace.indexOf('schema') === -1)) {
        deletePaths[matches[1]] = () => null;
        return null;
      }
      return {key, val};

    },
    "examples$": splitExamples,
    "^info > title$": () => {return {
      key: "title",
      val: `specs`
    }},
    "parameters > \\d+ > schema$": () => null, // @see https://github.com/apiaryio/api-elements.js/issues/226
    "text/xml > example$": () => null, // TODO work with this in dreddHooks?
    "application/octet-stream > example$": () => null, // TODO work with this in dreddHooks?
    "^paths > .*? > .*? > responses > (500|202)$": () => null,
    "schema > \\$ref$": resolveReference,
    "items > \\$ref$": resolveReference
  };


  while (iteration++ < iterations) {

    deletePaths = {};
    const targetFileName = `tmp/transformed.specs.${iteration}.yml`;
    const transformed = jsonTransform(yamlTree, rules, false);
    const transformed2 = jsonTransform(transformed, deletePaths, false);
    const transformedAsString = YAML.stringify(transformed2, 10);
    fs.writeFileSync(targetFileName, transformedAsString, "utf8");
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


gulp.task('update_docs', done => {

  cliPrint.headline('write compiled spec to docs folder');

  const compiledFileName = 'tmp/compiled.specs.yml';
  const targetFileName = '../docs/specs.yml';
  const yamlString = fs.readFileSync(compiledFileName, "utf8");
  const yamlTree = YAML.parse(yamlString);
  const localizeReference = (key, val) => {
    const referenceString = val.substring(val.lastIndexOf('#'));
    return {
      key: '$ref',
      val: referenceString
    }
  };

  const rules = {
    "schema > \\$ref$": localizeReference,
    "items > \\$ref$": localizeReference,
    "> version$": (key, val) => {return {
      key: "version",
      val: (val === "%%%VERSION%%%") ? composerFile['version'] : val
    }}
  };

  const transformed = jsonTransform(yamlTree, rules, false);
  const transformedAsString = YAML.stringify(transformed, 10);
  fs.writeFileSync(targetFileName, transformedAsString, "utf8");

  done();
});



gulp.task('update_sample_files', done => {

  cliPrint.headline('Update sample files');

  const regex = /xsi:noNamespaceSchemaLocation="[^"]+\/definitions\/v?o?_?(\S*).xsd"/gm;
  const reference = `xsi:noNamespaceSchemaLocation="${xsdUrl}/${composerFile['version']}/definitions/vo_$1.xsd"`;

  fs.readdirSync('../sampledata').forEach(file => {
    if (file.includes('.xml')) {
      console.log(`updating: ${file}`);
      const fileContents = fs.readFileSync('../sampledata/' + file);
      const newContents = fileContents.toString().replace(regex, reference);
      fs.writeFileSync('../sampledata/' + file, newContents);
    }
  });

  done();
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


exports.update_specs = gulp.series(
  'start',
  'compile_spec_files',
  'update_docs',
  'update_sample_files'
);
