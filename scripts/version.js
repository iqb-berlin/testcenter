/* eslint-disable no-console,import/no-extraneous-dependencies,implicit-arrow-linebreak */

/**
 * Contains all tasks round teh process of updating the version-number
 * See more documentation at the bottom of this file.
 */

const fs = require('fs');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const merge = require('merge-stream');
const replace = require('gulp-replace');
const tap = require('gulp-tap');
const download = require('gulp-download2');
const archiver = require('@bytestream/gulp-archiver');
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
  createNewVersionTag(versionType);
  console.log(`Target version is ${version.full}`);
  done();
};

const checkPrerequisites = async done => {
  cliPrint.headline('Check Prerequisites');

  // changelog updated?
  const changelog = fs.readFileSync(`${rootPath}/CHANGELOG.md`).toString();
  if (!changelog.match(`## (\\[next]|${version.full})`)) {
    const msg = `No section for '## ${version.full}' found in CHANGELOG.md. Add it or use '## [next]'`;
    done(new Error(cliPrint.get.error(msg)));
  }

  // TODO check sql patch

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
    /(xsi:noNamespaceSchemaLocation="https:\/\/raw\.githubusercontent\.com\/iqb-berlin\/testcenter)\/\d+.\d+.\d+/g,
    '$1/$VERSION'
  ),
  replaceInFiles(
    `${rootPath}/dist-src/docker-compose.prod.yml`,
    /(iqbberlin\/testcenter-(backend|frontend|broadcasting-service)):(.*)/g,
    '$1:$VERSION'
  ),
  replaceInFiles(
    `${rootPath}/CHANGELOG.md`,
    /## \[next]/g,
    '## $VERSION'
  )
);

const getUpdateSh = () =>
  download('https://raw.githubusercontent.com/iqb-berlin/iqb-scripts/master/update.sh')
    .pipe(gulp.dest(`${rootPath}/dist-src`));

const clearDistDir = () =>
  new Promise(resolve => fsExtra.emptyDir(`${rootPath}/dist`, resolve));

const createReleasePackage = async () =>
  merge([
    gulp.src(`${rootPath}/dist-src/docker-compose*`),
    gulp.src(`${rootPath}/dist-src/manage.sh`),
    gulp.src(`${rootPath}/dist-src/config/cert_config.yml`, { base: `${rootPath}/dist-src` }),
    gulp.src(`${rootPath}/dist-src/.env`),
    gulp.src(`${rootPath}/docker-compose.yml`),
    gulp.src(`${rootPath}/CHANGELOG.md`)
  ])
    .pipe(archiver(`testcenter-${version.full}.tar`))
    .pipe(gulp.dest(`${rootPath}/dist`));

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
  updateVersionInFiles,
  getUpdateSh,
  clearDistDir,
  createReleasePackage
);
