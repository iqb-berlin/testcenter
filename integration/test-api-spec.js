/**
 * Dredd does not support whole openapi3 spec right now. especially we need examples- element instead of example
 * so before testing with dredd we preparse the api
 */

const YAML = require('yamljs');
const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');
const {spawnSync} = require('child_process');
const {series} = require('gulp');
const {task} = require('gulp');

const printHeadline = text => console.log(`\x1b[37m\x1b[44m${text}\x1b[0m`);
const tmpSpecFileName = filterExampleCode => "tmp/admin.api." + filterExampleCode + ".yaml";

const args = process.argv.slice(-1);
const endpoint = args[0].substring(6);

const exampleCodes = ['a', 'b'];
let filterExampleCode = 'a';

task('info', done => {

    if (!endpoint) {
        throw new Error("no endpoint given");
    }
    printHeadline(`running Dredd tests against API: ${endpoint}`);
    done();
});

task('clear_tmp_dir', done => {

    printHeadline("clear tmp dir");

    fsExtra.emptyDirSync('./tmp');
    done();
});

task('prepare_spec_for_dredd', done => {

    printHeadline("creating dredd-compatible API-Spec version " + filterExampleCode);

    const isType = (type, val) =>
        (val === null)
            ? (type === 'null')
            : !!(val.constructor && val.constructor.name.toLowerCase() === type.toLowerCase());

    const rules = {

        examples: {
            key: "example",
            val: examples => (typeof examples[filterExampleCode] !== "undefined")
                                ? examples[filterExampleCode].value
                                : null
        },
        title: {
            key: "title",
            val: () => "transformed spec"
        }
    };

    const transformTree = (branch) => {

        if (isType('array', branch)) {
            return branch.map(transformTree);
        }

        if (isType('object', branch)) {
            let transformedBranch = {};
            Object.keys(branch).forEach(entry => {
                if (typeof rules[entry] === "undefined") {
                    transformedBranch = {...transformedBranch, [entry]: transformTree(branch[entry])};
                    return;
                }
                let newValue =  rules[entry].val(branch[entry]);
                if (newValue === null) {
                    return;
                }
                transformedBranch = {...transformedBranch, [rules[entry].key]: transformTree(newValue)}

            });

            return transformedBranch;
        }

        return branch;
    };

    let spec = YAML.parse(fs.readFileSync("../specs/test.api.yaml", "utf8"));
    spec = YAML.stringify(transformTree(spec), 10);
    fs.writeFileSync(tmpSpecFileName(filterExampleCode), spec, "utf8");
    console.log(`${tmpSpecFileName(filterExampleCode)} written.`);
    done();
});

task('run_dredd', done => {

    printHeadline("run dredd with " + tmpSpecFileName(filterExampleCode));
    new Dredd({
        endpoint: endpoint,
        path: [tmpSpecFileName(filterExampleCode)],
        hookfiles: ['hooks.js'],
        output: [`tmp/report.${tmpSpecFileName(filterExampleCode)}.html`],
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

task('run_dredd_apib', done => {

    printHeadline("run dredd with ../specs/admin.api.apib");
    new Dredd({
        endpoint: endpoint,
        path: '../specs/admin.api.apib',
        hookfiles: ['hooks.js'],
        output: [`tmp/apib.report.apib.html`],
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

function shellExec(command, params = []) {

    const process = spawnSync(command, params);

    if (process.status > 0) {
        console.error(`Error: ${process.stderr.toString()}`);
        return false;
    }
    console.log(process.stdout.toString());
    return true;
}

task('init_backend', done => {

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


task('db_clean', done => {

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

task('change_example_code', done => {

    filterExampleCode = exampleCodes[exampleCodes.indexOf(filterExampleCode) + 1];
    if (typeof filterExampleCode === "undefined") {
        filterExampleCode = exampleCodes[0];
    }
    printHeadline(`change example code to ${filterExampleCode}`);

    done();
});


exports.run_dredd_test = series(
    'info',
    // 'clear_tmp_dir',
    // 'db_clean',
    // 'init_backend',
    'prepare_spec_for_dredd',
    'run_dredd',
    'change_example_code',
    // 'db_clean',
    // 'init_backend',
    'prepare_spec_for_dredd',
    'run_dredd'
);

exports.repeat_dredd_test = series(
    'run_dredd'
);

exports.run_dredd_apib = series(
    'info',
    'clear_tmp_dir',
    'db_clean',
    'init_backend',
    'run_dredd_apib'
);
