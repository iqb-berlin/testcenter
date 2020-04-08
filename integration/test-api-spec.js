const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const jsonTransform = require('./helper/json-transformer');
const YAML = require('yamljs');

// globals

const apiUrl = process.env.TC_API_URL || 'http://localhost';

// helper functions

const printHeadline = text => console.log(`\x1b[37m\x1b[44m${text}\x1b[0m`);

const getError = text => new Error(`\x1B[31m${text}\x1B[34m`);

// tasks

gulp.task('start', done => {

    if (!apiUrl) {
        done(getError("No API Url given!"));
    }

    printHeadline(`Running Dredd tests against API: ${apiUrl}`);
    done();
});

gulp.task('clear_tmp_dir', done => {

    printHeadline("clear tmp dir");

    fsExtra.emptyDirSync('./tmp');
    done();
});

gulp.task('compile_spec_files', function() {

    printHeadline(`compile spec files to one`);

    return gulp.src(`../routes/*.spec.yml`)
        .on("data", function(d) { console.log("File: " + d.path);})
        .on("error", function(e) { console.warn(e);})
        .pipe(yamlMerge('compiled.specs.yml'))
        .pipe(gulp.dest('./tmp/'));
});

gulp.task('prepare_spec_for_dredd', done => {

    const compiledFileName = 'tmp/compiled.specs.yml';
    const targetFileName = 'tmp/transformed.specs.yml';

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
        "^paths > .*? > .*? > responses > (404|500|202)$": () => null,
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

    printHeadline(`run dredd against ${apiUrl}`);

    const dreddFileName = 'tmp/transformed.specs.yml';

    new Dredd({
        endpoint: apiUrl,
        path: [dreddFileName],
        hookfiles: ['dredd-hooks.js'],
        output: [`tmp/report.${dreddFileName}.html`],
        reporter: ['html'],
        names: false,
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


gulp.task('update_docs', done => {

    printHeadline('copy compiled spec and redoc lib to docs folder');

    const compiledFileName = 'tmp/compiled.specs.yml';
    const targetFileName = '../docs/api_doc_files/specs.yml';
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

exports.update_specs = gulp.series(
    'start',
    'compile_spec_files',
    'prepare_spec_for_dredd',
    'update_docs'
);
