/**
 * The API specs are split over several files in `docs/api`: `api.spec.yml` is the OpenAPI document with everything
 * but the endpoints, every other `*.spec.yml` contains nothing but `paths`. `loadSpecs` merges them into one document.
 *
 * Run directly, this writes the merged document to `docs/site/public/api/specs.yml`, from which Redoc builds the
 * API documentation.
 */

const fs = require('fs');
const YAML = require('yaml');
const packageJson = require('../package.json');

const specsDir = fs.realpathSync(`${__dirname}/../docs/api`);
const docsTargetDir = `${__dirname}/../docs/site/public/api`;
const rootFileName = 'api.spec.yml';
const versionPlaceholder = '%%%VERSION%%%';

const isPlainObject = value => (typeof value === 'object') && (value !== null) && !Array.isArray(value);

// references into the root file become local, as all fragments end up in it
const localizeReference = (reference, fileName) => {
  const [file, pointer] = reference.split('#');
  if (!['', `./${rootFileName}`].includes(file)) {
    throw new Error(`${fileName}: \`${reference}\` - references may only point into ${rootFileName}`);
  }
  return `#${pointer}`;
};

const localizeReferencesAndVersion = (node, fileName) => {
  if (Array.isArray(node)) {
    return node.map(item => localizeReferencesAndVersion(item, fileName));
  }
  if (!isPlainObject(node)) {
    return (node === versionPlaceholder) ? packageJson.version : node;
  }
  return Object.fromEntries(Object.entries(node)
    .map(([key, value]) => [
      key,
      (key === '$ref') ? localizeReference(value, fileName) : localizeReferencesAndVersion(value, fileName)
    ]));
};

const readSpecFile = fileName => localizeReferencesAndVersion(
  YAML.parse(fs.readFileSync(`${specsDir}/${fileName}`, 'utf8')),
  fileName
);

const allFragmentFileNames = () => fs.readdirSync(specsDir)
  .filter(fileName => fileName.endsWith('.spec.yml') && (fileName !== rootFileName))
  .toSorted();

exports.loadSpecs = (fragmentFileNames = allFragmentFileNames()) => {
  const specs = readSpecFile(rootFileName);
  const definedIn = {};

  fragmentFileNames.forEach((fileName) => {
    const fragment = readSpecFile(fileName);
    const unexpectedKeys = Object.keys(fragment).filter(key => key !== 'paths');
    if (unexpectedKeys.length) {
      throw new Error(`${fileName}: may contain nothing but \`paths\`, found \`${unexpectedKeys.join('`, `')}\``);
    }
    Object.entries(fragment.paths).forEach(([path, pathItem]) => {
      if (definedIn[path]) {
        throw new Error(`${fileName}: \`${path}\` is already defined in ${definedIn[path]}`);
      }
      definedIn[path] = fileName;
      specs.paths[path] = pathItem;
    });
  });

  return specs;
};

if (require.main === module) {
  fs.mkdirSync(docsTargetDir, { recursive: true });
  fs.writeFileSync(`${docsTargetDir}/specs.yml`, YAML.stringify(exports.loadSpecs()), 'utf8');
  console.log(`API specs written to ${fs.realpathSync(docsTargetDir)}/specs.yml`);
}
