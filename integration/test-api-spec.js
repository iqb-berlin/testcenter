const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const yamlMerge = require('gulp-yaml-merge');
const YAML = require('yamljs');
const inquirer = require('inquirer');
const cliPrint = require('./helper/cli-print');
const jsonTransform = require('./helper/json-transformer');

// globals

const apiUrl = process.env.TC_API_URL || 'http://localhost';
const specialTestConfig = fs.existsSync('../config/e2eTests.json')
    ? JSON.parse(fs.readFileSync('../config/e2eTests.json').toString())
    : false;


// tasks

gulp.task('start', done => {

    if (!apiUrl) {
        done(cliPrint.getError("No API Url given!"));
    }

    cliPrint.headline(`Running Dredd tests against API: ${apiUrl}`);

    if ((specialTestConfig !== false) && (typeof specialTestConfig.configFile !== "undefined")) {

        inquirer.prompt([{
            type: 'confirm',
            message: cliPrint.red('You run this in REALDATAMODE - that means you want ' +
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
        .on("data", function(d) { console.log("File: " + d.path);})
        .on("error", function(e) { console.warn(e);})
        .pipe(yamlMerge('compiled.specs.yml'))
        .pipe(gulp.dest('./tmp/'));
});

gulp.task('prepare_spec_for_dredd', done => {

    const compiledFileName = 'tmp/compiled.specs.yml';
    const targetFileName = 'tmp/transformed.specs.yml';

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
        "^paths > .*? > .*? > responses > (500|202)$": () => null,
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

    cliPrint.headline(`run dredd against ${apiUrl}`);

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
            done(cliPrint.getError(`Dredd Tests: ` + err));
        }
        if (stats.errors + stats.failures > 0) {
            done(cliPrint.getError(`Dredd Tests: ${stats.failures} failed and ${stats.errors} finished with error.`));
        }
        done();
    });
});


gulp.task('update_docs', done => {

    cliPrint.headline('copy compiled spec and redoc lib to docs folder');

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
        "items > \\$ref$": localizeReference
    };

    const transformed = jsonTransform(yamlTree, rules, false);
    const transformedAsString = YAML.stringify(transformed, 10);
    fs.writeFileSync(targetFileName, transformedAsString, "utf8");

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
    'update_docs'
);


exports.update_specs = gulp.series(
    'start',
    'compile_spec_files',
    'prepare_spec_for_dredd',
    'update_docs'
);
