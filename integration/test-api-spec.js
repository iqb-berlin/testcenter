/**
 * Dredd does not support whole openapi3 spec right now. especially we need examples- element instead of example
 * so before testing with dredd we preparse the api
 */

const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');
const {spawnSync} = require('child_process');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const jsonTransform = require('./json-transformer');
const YAML = require('yamljs');

const args = process.argv.slice(-1);
const endpoint = args[0].substring(6);
const specFileName = 'admin.api.yaml';

const printHeadline = text => console.log(`\x1b[37m\x1b[44m${text}\x1b[0m`);
const tmpFileName = fileName => "tmp/transformed." + fileName;

const shellExec = (command, params = []) => {

    const process = spawnSync(command, params);

    if (process.status > 0) {
        console.error(`Error: ${process.stderr.toString()}`);
        return false;
    }
    console.log(process.stdout.toString());
    return true;
};

gulp.task('info', done => {

    if (!endpoint) {
        throw new Error("no endpoint given");
    }

    printHeadline(`running Dredd tests against API: ${endpoint}`);
    done();
});

gulp.task('clear_tmp_dir', done => {

    printHeadline("clear tmp dir");

    fsExtra.emptyDirSync('./tmp');
    done();
});

gulp.task('compile_spec_files', function() {

    printHeadline(`compile spec files to one`);

    return gulp.src('../admin/routes/*.spec.yml')
        .on("data", function(d) { console.log("File: " + d.path);})
        // .on("error", function(e) { console.warn(e);})
        // .pipe(map(function(file, done) {
        //     const yaml = YAML.parse(file.contents);
        //     // file.contents = new Buffer(YAML.stringify(yaml.paths));
        //     done(null, file);
        // }))
        // .pipe(concat('compiled_specs.yml'))
        .pipe(yamlMerge('compiled_specs.yml'))
        .pipe(gulp.dest('./tmp/'));
});

gulp.task('prepare_spec_for_dredd', done => {

    printHeadline(`creating Dredd-compatible API-Spec version: ${specFileName}`);

    const yamlString = fs.readFileSync("tmp/compiled_specs.yml", "utf8");
    const yamlTree = YAML.parse(yamlString);
    const resolveReference = (key, val) => {
        const referenceString = val.substring(val.lastIndexOf('/') + 1);
        console.log("resolving reference '" + val + "' - |" + referenceString + "|");
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

    const transformed = jsonTransform(yamlTree, rules);
    const transformedAsString = YAML.stringify(transformed, 10);
    fs.writeFileSync(tmpFileName(specFileName), transformedAsString, "utf8");
    console.log(`${tmpFileName(specFileName)} written.`);
    done();
});

gulp.task('run_dredd', done => {

    printHeadline("run dredd");
    new Dredd({
        endpoint: endpoint,
        path: [tmpFileName(specFileName)],
        hookfiles: ['dredd-hooks.js'],
        output: [`tmp/report.${tmpFileName(specFileName)}.html`],
        reporter: ['html'],
        names: false
    }).run(function(err, stats) {
        if (err) {
            console.error(err);
        }
        console.log(stats);
        done();
    });
});

gulp.task('init_backend', done => {

    printHeadline('run init script');
    shellExec('php',
        [
            '../scripts/initialize.php',
            `--user_name=super`,
            `--user_password=user123`,
            `--workspace=example_workspace`,
            `--test_login_name=test`,
            `--test_login_password=user123`,
        ]
    );
    done();
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
    shellExec('mysql',
        [
            `--user=${sqlConfig.user}`,
            `--password=${sqlConfig.password}`,
            `--execute=${sql}`
        ]
    );
    done();
});

exports.run_dredd_test = gulp.series(
    'info',
    'clear_tmp_dir',
    'compile_spec_files',
    'db_clean',
    'init_backend',
    'prepare_spec_for_dredd',
    'run_dredd',

);

exports.repeat_dredd_test = gulp.series(
    'compile_spec_files',
    'prepare_spec_for_dredd',
    'run_dredd'
);

exports.xx = gulp.series(
    'compile_spec_files'
);
