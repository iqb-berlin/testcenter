/* eslint-disable no-console */

/**
 * Can transform highly complex json-objects by a set of rules. It's used to create Version of the API-Specs for ReDoc
 * and for Dredd.
 */

module.exports = function jsonTransformer(json, rules, verbose = false) {
  const isType = (type, val) => ((val === null)
    ? (type === 'null')
    : !!(val.constructor && val.constructor.name.toLowerCase() === type.toLowerCase()));

  const toObject = thing => {
    if (isType('object', thing)) return { ...thing };
    if (isType('array', thing)) return thing.values;
    return { value: thing };
  };

  const toArray = thing => {
    if (isType('array', thing)) return thing;
    if (isType('object', thing)) return Object.values(thing);
    return [thing];
  };

  const ruleAsFunction = rule => {
    if (typeof rule === 'function') {
      return rule;
    }
    if (rule == null) {
      return () => null;
    }
    if (typeof rule === 'object' && 'key' in rule && 'val' in rule) {
      return () => rule;
    }
    return key => ({ key, val: rule });
  };

  const applyRules = (key, value, trace) => {
    const traceString = trace.join(' > ');

    let newKeyValue = {
      key,
      val: value
    };

    Object.keys(rules).forEach(rulePattern => {
      const matches = traceString.match(new RegExp(rulePattern));
      if (matches && matches.length) {
        newKeyValue = ruleAsFunction(rules[rulePattern])(key, value, matches, trace);
        if (verbose) {
          console.log(`JSON Transformer: ${trace.join(' > ')} => ${newKeyValue ? newKeyValue.key : '(remove)'}`);
        }
      }
    });

    return newKeyValue;
  };

  const warnOnUndefined = (object, place) => {
    if (typeof object === 'undefined') {
      console.warn(`[undefined] at ${place}`);
    }
  };

  const transformTree = (tree, trace = []) => {
    if (isType('array', tree)) {
      const transformedTree = [];

      Object.keys(tree).forEach(key => {
        const replace = applyRules(key, tree[key], [...trace, key]);

        if (replace !== null) {
          if (replace.key === null) {
            warnOnUndefined(replace.val, `${trace.join(' > ')} >> ${key}`);

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
            warnOnUndefined(replace.val, `${trace.join(' > ')} >> ${key}`);
            const valueAsObject = toObject(replace.val);
            Object.keys(valueAsObject)
              .forEach(item => {
                transformedTree = { ...transformedTree, [item]: transformTree(valueAsObject[item], [...trace, item]) };
              });
          } else {
            transformedTree = { ...transformedTree, [replace.key]: transformTree(replace.val, [...trace, key]) };
          }
        }
      });

      return transformedTree;
    }

    return tree;
  };

  return transformTree(json);
};
