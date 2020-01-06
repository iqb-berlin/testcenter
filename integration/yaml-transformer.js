const YAML = require('yamljs');

module.exports = function(yamlString) {

    const isType = (type, val) =>
        (val === null)
            ? (type === 'null')
            : !!(val.constructor && val.constructor.name.toLowerCase() === type.toLowerCase());

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
        "^paths > .*? > .*? > responses > [^2]\\d\\d$": () => null
    };

    const applyRules = (key, value, trace) => {

        const traceString = trace.join(' > ');
        // console.log(traceString);

        let newKeyValue = {
            key: key,
            val: value
        };
        Object.keys(rules).forEach(rulePattern => {
            const matches = traceString.match(new RegExp(rulePattern));
            if (matches && matches.length) {
                newKeyValue = rules[rulePattern](key, value);
                console.log('YAML Transformer: ' + trace.join(' > ') + " => " +(newKeyValue ? newKeyValue.key : '(remove)'));
            }
        });
        return newKeyValue;
    };

    const transformTree = (tree, trace = []) => {

        if (isType('array', tree)) {
            let transformedTree = [];
            Object.keys(tree).forEach(key => {
                const replace = applyRules(key, tree[key], [...trace, key]);
                if (replace !== null) {
                    transformedTree.push(transformTree(replace.val, [...trace, key]));
                }
            });
            return transformedTree;
        }

        if (isType('object', tree)) {
            let transformedTree = {};
            Object.keys(tree).forEach(key => {
                const replace = applyRules(key, tree[key], [...trace, key]);
                if (replace !== null) {
                    transformedTree = {...transformedTree, [replace.key]: transformTree(replace.val, [...trace, key])}
                }
            });
            return transformedTree;
        }

        return tree;
    };


    let spec = YAML.parse(yamlString);
    const specTrans = transformTree(spec);
    return YAML.stringify(specTrans, 10);
};

