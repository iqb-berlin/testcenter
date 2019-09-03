/**
 * Dredd does not support whole openapi3 spec right now. especially we need examples- element instead of example
 * so before testing with dredd we preparse the api
 */

const YAML = require('yamljs');
const fs = require("fs");
const Dredd = require('dredd');
const fsExtra = require('fs-extra');

function clear_tmp_dir() {

    fsExtra.emptyDirSync('./tmp');
}

function prepare_spec_for_dredd(filterExampleCode) {

    const isType = (type, val) =>
        (val === null)
            ? (type === 'null')
            : !!(val.constructor && val.constructor.name.toLowerCase() === type.toLowerCase());

    const rules = {

        examples: {
            key: "example",
            val: examples => (typeof examples[filterExampleCode] !== "undefined")
                                ? examples[filterExampleCode].value
                                : examples.a.value
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
                if (typeof rules[entry] !== "undefined") {
                    transformedBranch = {...transformedBranch, [rules[entry].key]: transformTree(rules[entry].val(branch[entry]))}
                } else {
                    transformedBranch = {...transformedBranch, [entry]: transformTree(branch[entry])}
                }
            });

            return transformedBranch;
        }

        return branch;
    };

    let spec = YAML.parse(fs.readFileSync("../specs/admin.api.yaml", "utf8"));
    spec = YAML.stringify(transformTree(spec), 10);
    fs.writeFileSync("tmp/admin.api." + filterExampleCode + ".yaml", spec, "utf8");
}



function run_dredd() {

    new Dredd({
        endpoint: process.argv[2],
        path: ['tmp/*'],
        hookfiles: ['hooks.js'],
        output: ['tmp/report.html'],
        reporter: ['html'],
        names: false
    }).run(function(err, stats) {
        if (err) {
            console.error(err);
        }
        console.log(stats);
    });
}

clear_tmp_dir();
console.log('### running dredd tests against API:' + process.argv[2]);
prepare_spec_for_dredd('a');
prepare_spec_for_dredd('b');
prepare_spec_for_dredd('c');
run_dredd();
