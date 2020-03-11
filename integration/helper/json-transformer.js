module.exports = function(json, rules, verbose = false) {

    const isType = (type, val) =>
        (val === null)
            ? (type === 'null')
            : !!(val.constructor && val.constructor.name.toLowerCase() === type.toLowerCase());

    const toObject = (thing) => {

        if (isType('object', thing)) return Object.assign({}, thing);
        if (isType('array', thing)) return thing.values;
        return {value: thing};
    };

    const toArray = (thing) => {

        if (isType('array', thing)) return thing;
        if (isType('object', thing)) return Object.values(thing);
        return [thing];
    };

    const applyRules = (key, value, trace) => {

        const traceString = trace.join(' > ');

        let newKeyValue = {
            key: key,
            val: value
        };

        Object.keys(rules).forEach(rulePattern => {
            const matches = traceString.match(new RegExp(rulePattern));
            if (matches && matches.length) {
                newKeyValue = rules[rulePattern](key, value);
                if (verbose) console.log('YAML Transformer: ' + trace.join(' > ') + " => " +(newKeyValue ? newKeyValue.key : '(remove)'));
            }
        });

        return newKeyValue;
    };

    const warnOnUndefined = (object, place) => {

        if (typeof object === "undefined") {
            console.warn("[undefined] at " + place);
        }
    };

    const transformTree = (tree, trace = []) => {

        if (isType('array', tree)) {

            let transformedTree = [];

            Object.keys(tree).forEach(key => {

                const replace = applyRules(key, tree[key], [...trace, key]);

                if (replace !== null) {

                    if (replace.key === null) {

                        warnOnUndefined(replace.val, trace.join(' > ') + ' >> ' + key);

                        toArray(replace.val).forEach(item => {
                            transformedTree.push(transformTree(item, [...trace, key]));
                        });

                    } else {
                        transformedTree.push(transformTree(replace.val, [...trace, key]));
                    }

                }

            });

            return transformedTree;
        }

        if (isType('object', tree)) {

            let transformedTree = {};

            Object.keys(tree).forEach(key => {

                const replace = applyRules(key, tree[key], [...trace, key]);

                if (replace !== null) {

                    if (replace.key === null) {

                        warnOnUndefined(replace.val, trace.join(' > ') +  ' >> ' + key);

                        const valueAsObject = toObject(replace.val);

                        Object.keys(valueAsObject).forEach(key => {
                            transformedTree = {...transformedTree, [key]: transformTree(valueAsObject[key], [...trace, key])}
                        })

                    } else {
                        transformedTree = {...transformedTree, [replace.key]: transformTree(replace.val, [...trace, key])}
                    }

                }
            });

            return transformedTree;
        }

        return tree;
    };

    return transformTree(json);

};

