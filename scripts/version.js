/* eslint-disable no-console,import/no-extraneous-dependencies,implicit-arrow-linebreak */

/**
 * Contains all tasks round teh process of updating the version-number
 * See more documentation at the bottom of this file.
 */

const fs = require('fs');
const gulp = require('gulp');
const replace = require('gulp-replace');
const tap = require('gulp-tap');
const cliPrint = require('./helper/cli-print');

const rootPath = fs.realpathSync(`${__dirname}'/..`);

const packageJson = require('../package.json');

// see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// eslint-disable-next-line max-len
const semVerRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const version = {};
[version.full, version.major, version.minor, version.patch, version.label] = packageJson.version.match(semVerRegex);

const createNewVersionTag = arg => {
  const [tagType, newLabel] = arg.split('-');

  if (typeof version[tagType] !== 'undefined') {
    const newNumber = parseInt(version[tagType], 10) + 1;
    version.minor = (tagType === 'major') ? 0 : version.minor;
    version.patch = ((tagType === 'major') || (tagType === 'minor')) ? 0 : version.patch;
    version[tagType] = newNumber;
  }
  version.label = newLabel || '';
  version.full = `${version.major}.${version.minor}.${version.patch}${version.label ? `-${version.label}` : ''}`;
};

const updateVersion = async done => {
  const lastArg = process.argv.pop();
  const versionType = (lastArg === 'bash') ? 'patch' : lastArg;
  cliPrint.headline(`Prepare new version-tag: ${versionType}`);
  console.log(`Current version is ${version.full}`);
  const oldVersion = version.full;
  createNewVersionTag(versionType);
  console.log(`Target version is ${version.full}`);
  if (oldVersion === version.full) {
    throw new Error(`No new Version given on ${lastArg}!`);
  }
  done();
};

const checkPrerequisites = async done => {
  cliPrint.headline('Check Prerequisites');

  // changelog updated?
  const changelog = fs.readFileSync(`${rootPath}/docs/CHANGELOG.md`).toString();
  if (!changelog.match(`## (\\[next]|${version.full})`)) {
    const msg = `No section for '## ${version.full}' found in CHANGELOG.md. Add it or use '## [next]'`;
    done(new Error(cliPrint.get.error(msg)));
  }

  done();
};

const savePackageJson = async done => {
  packageJson.version = version.full;
  fs.writeFileSync(`${rootPath}/package.json`, JSON.stringify(packageJson, null, 2));
  cliPrint.success(`[x] /package.json updated with ${version.full}`);
  done();
};

const replaceInFiles = (glob, regex, replacement) =>
  () => gulp.src(glob)
    .pipe(replace(regex, replacement.replace('$VERSION', version.full))) // manually replace version here because timing
    .pipe(tap(file => fs.rmSync(file.path))) // delete file before replacing, so that IDEA realized the change
    .pipe(gulp.dest(file => file.base))
    .on('error', err => { throw new Error(cliPrint.get.error(err.toString())); })
    .pipe(tap(file => cliPrint.success(`[x] ${file.path.replace(rootPath, '')} updated with ${version.full}`)));

const updateVersionInFiles = gulp.parallel(
  replaceInFiles(
    `${rootPath}/sampledata/*.xml`,
    /(xsi:noNamespaceSchemaLocation="https:\/\/raw\.githubusercontent\.com\/iqb-berlin\/testcenter)\/\d+.\d+.\d+(-[\w.]+)?/g,
    '$1/$VERSION'
  ),
  replaceInFiles(
    `${rootPath}/docs/CHANGELOG.md`,
    /## \[next]/g,
    '## $VERSION'
  ),
  replaceInFiles(
    `${rootPath}/dist-src/.env.prod-template`,
    /VERSION=\d+.\d+.\d+(-\S+)?/g,
    'VERSION=$VERSION'
  )
);

const updateSQLPatch = async done => {
  const nextSQLPatchFileName = `${rootPath}/scripts/database/patches.d/next.sql`;
  if (fs.existsSync(nextSQLPatchFileName)) {
    fs.renameSync(nextSQLPatchFileName, `${rootPath}/scripts/database/patches.d/${version.full}.sql`);
  }
  done();
};

/**
 * Creates a new version number
 * Which type depends on the last parameter provided.
 *
 * `bash -c 'npx gulp --gulpfile=./scripts/version.js newVersion --options {tag-type}`
 *
 * {tag-type} can be `major`, `minor`, `patch`. You can also add a label after a hyphen: `major-rc1`, `minor-beta`.
 * If you want to release the same version again with another label use `-beta` for example.
 *
 * After this step, every test should be run.
 */
exports.newVersion = gulp.series(
  updateVersion,
  checkPrerequisites,
  savePackageJson, // TODO how about package-lock?
  updateSQLPatch,
  updateVersionInFiles
);
