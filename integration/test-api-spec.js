const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');
const {spawnSync} = require('child_process');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const jsonTransform = require('./helper/json-transformer');
const YAML = require('yamljs');

// globals

const apiUrl = process.env.TC_API_URL || 'http://localhost';
const apiSubfolder = 'admin'; // to be removed if APIs are merged

// helper functions

const printHeadline = text => console.log(`\x1b[37m\x1b[44m${text}\x1b[0m`);

const getError = text => new Error(`\x1B[31m${text}\x1B[34m`);

const shellExec = (command, params = []) => {

    const process = spawnSync(command, params);

    if (process.status == null) {
        return getError(`Could not execute command: ${command}`);
    }

    if (process.status > 0) {
        console.log(process.stdout.toString());
        return getError(`in command ${command}:\n ${process.stderr.toString()}`);
    }

    console.log(process.stdout.toString());
    return process.status;
};


// tasks

gulp.task('start', done => {

    const endpoint = apiUrl + '/' + apiSubfolder;

    if (!endpoint) {
        done(getError("no endpoint given"));
    }

    printHeadline(`Running Dredd tests against API: ${endpoint}`);
    done();
});

gulp.task('clear_tmp_dir', done => {

    printHeadline("clear tmp dir");

    fsExtra.emptyDirSync('./tmp');
    done();
});

gulp.task('compile_spec_files', function() {

    printHeadline(`compile spec files to one`);

    return gulp.src(`../${apiSubfolder}/routes/*.spec.yml`)
        .on("data", function(d) { console.log("File: " + d.path);})
        .on("error", function(e) { console.warn(e);})
        .pipe(yamlMerge(apiSubfolder + '.compiled.specs.yml'))
        .pipe(gulp.dest('./tmp/'));
});

gulp.task('prepare_spec_for_dredd', done => {

    const compiledFileName = 'tmp/' + apiSubfolder + '.compiled.specs.yml';
    const targetFileName = 'tmp/' + apiSubfolder + '.transformed.specs.yml';

    printHeadline(`Creating Dredd-compatible API-spec version from ${compiledFileName}`);

    const yamlString = fs.readFileSync(compiledFileName, "utf8");
    const yamlTree = YAML.parse(yamlString);
    const resolveReference = (key, val) => {
        const referenceString = val.substring(val.lastIndexOf('/') + 1);
        return {
            key: null,
            val: yamlTree.components.schemas[referenceString]
        }
    };

    const rules = {

        "examples$": (key, val) => {return {
            key: "example",
            val: val[Object.keys(val)[0]].value
        }},
        "^info > description$": (key, val) => {return {
            key: "description",
            val: val + " - transformed to be dredd compatible"
        }},
        "parameters > \\d+ > schema$": () => null,
        "text/xml > example$": () => null,
        "application/octet-stream > example$": () => null,
        "^paths > .*? > .*? > responses > [^2]\\d\\d$": () => null,
        "schema > \\$ref$": resolveReference,
        "items > \\$ref$": resolveReference
    };

    const transformed = jsonTransform(yamlTree, rules, false);
    const transformedAsString = YAML.stringify(transformed, 10);
    fs.writeFileSync(targetFileName, transformedAsString, "utf8");
    console.log(`${targetFileName} written.`);
    done();
});

gulp.task('run_dredd', done => {

    printHeadline(`run dredd against ${apiUrl + '/' + apiSubfolder}`);

    const dreddFileName = 'tmp/' + apiSubfolder + '.transformed.specs.yml';

    new Dredd({
        endpoint: apiUrl + '/' + apiSubfolder,
        path: [dreddFileName],
        hookfiles: ['dredd-hooks.js'],
        output: [`tmp/report.${dreddFileName}.html`],
        reporter: ['html'],
        names: false
    }).run(function(err, stats) {
        console.log(stats);
        if (err) {
            done(getError(`Dredd Tests: ` + err));
        }
        if (stats.errors + stats.failures > 0) {
            done(getError(`Dredd Tests: ${stats.failures} failed and ${stats.errors} finished with error.`));
        }
        done();
    });
});

gulp.task('init_backend', done => {

    printHeadline('run init script');
    const exitCode = shellExec('php',
        [
            '../scripts/initialize.php',
            `--user_name=super`,
            `--user_password=user123`,
            `--workspace=example_workspace`,
            `--test_login_name=test`,
            `--test_login_password=user123`,
        ]
    );
    done(exitCode);
});


gulp.task('db_clean', done => {

    printHeadline('wipe out db and set up a clean one');
    const sqlConfig = require('../config/DBConnectionData');
    const sql =
        `DROP DATABASE IF EXISTS ${sqlConfig.dbname};` +
        `CREATE DATABASE ${sqlConfig.dbname};`  +
        `USE ${sqlConfig.dbname};` +
        `SOURCE ../scripts/sql-schema/mysql.sql;`;
        //`GRANT ALL PRIVILEGES ON \`${sqlConfig.dbname}\`.* TO '${sqlConfig.user}'@'${sqlConfig.host}';`;*/
    const exitCode = shellExec('mysql',
        [
            `--user=${sqlConfig.user}`,
            `--password=${sqlConfig.password}`,
            `--execute=${sql}`
        ]
    );
    done(exitCode);
});


gulp.task('update_docs', done => {

    printHeadline('copy compiled spec and redoc lib to docs folder');

    const compiledFileName = 'tmp/' + apiSubfolder + '.compiled.specs.yml';
    const targetFileName = '../docs/api_doc_files/specs.yml';
    const yamlString = fs.readFileSync(compiledFileName, "utf8");
    const yamlTree = YAML.parse(yamlString);
    const localizeReference = (key, val) => {
        const referenceString = val.substring(val.lastIndexOf('#'));
        return {
            key: null,
            val: referenceString
        }
    };

    const rules = {
        "schema > \\$ref$": localizeReference,
        "items > \\$ref$": localizeReference
    };

    const transformed = jsonTransform(yamlTree, rules, false);
    const transformedAsString = YAML.stringify(transformed, 10);
    fs.writeFileSync(targetFileName, transformedAsString, "utf8");

    done();

});


exports.run_dredd_test = gulp.series(
    'start',
    'clear_tmp_dir',
    'compile_spec_files',
    'db_clean',
    'init_backend',
    'prepare_spec_for_dredd',
    'run_dredd',
    'update_docs'
);

exports.repeat_dredd_test = gulp.series(
    'start',
    'compile_spec_files',
    'prepare_spec_for_dredd',
    'run_dredd'
);
