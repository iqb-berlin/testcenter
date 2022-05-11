/* eslint-disable no-console,import/no-extraneous-dependencies,implicit-arrow-linebreak */
const fs = require('fs');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const { execSync } = require('child_process');
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
  const arg = process.argv.pop();
  cliPrint.headline(`Prepare new version-tag: ${arg}`);
  console.log(`Current version is ${version.full}`);
  createNewVersionTag(arg);
  console.log(`Target version is ${version.full}`);
  done();
};

const checkPrerequisites = async done => {
  cliPrint.headline('Check Prerequisites');

  // on master?
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch !== 'master') {
    done(new Error(cliPrint.get.error(`ERROR: Not on master branch! (but on: ${branch})`)));
  }
  cliPrint.success('[x] on master-branch');

  // pulled?
  const pulled = execSync('git fetch origin --dry-run').toString().trim();
  if (pulled !== '') {
    done(new Error(cliPrint.get.error('ERROR: Not up to date with remote branch!')));
  }
  cliPrint.success('[x] Up to date with remote branch.');

  // tag exists
  let tagExists = true;
  try {
    execSync(`git show-ref --tags "${version.full}" --quiet`);
  } catch (e) {
    tagExists = false;
  }
  if (tagExists) {
    done(new Error(cliPrint.get.error(`GitTag ${version.full} already exists!`)));
  }
  cliPrint.success(`[x] Git-tag ${version.full} unused.`);

  // changelog updated?
  const changelog = fs.readFileSync(`${rootPath}/CHANGELOG.md`).toString();
  if (!changelog.match(`## (\\[next]|${version.full})`)) {
    const msg = `No section for '## ${version.full}' found in CHANGELOG.md. Add it or use '## [next]'`;
    done(new Error(cliPrint.get.error(msg)));
  }

  // everything committed?
  const committed = execSync('git status --porcelain').toString().trim();
  if (committed !== '') {
    done(new Error(cliPrint.get.error('Workspace not clean. Commit or stash your changes.')));
  }
  cliPrint.success('[x] Workspace clean.');

  done();
};

const savePackageJson = async done => {
  fs.writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));
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

const revokeTag = async done => {
  cliPrint.headline('Revoke to previous state after failure');
  try {
    execSync('git reset --hard');
  } catch (error) {
    done(new Error(cliPrint.get.error(`ERROR: Could not revoke state:${error}`)));
  }
  cliPrint.success('[x] Automatically changed files revoked');
  done();
};

const getUpdateSh = () =>
  download('https://raw.githubusercontent.com/iqb-berlin/iqb-scripts/master/update.sh')
    .pipe(gulp.dest(`${rootPath}/dist-src`));

const clearDistDir = () =>
  new Promise(resolve => fsExtra.emptyDir(`${rootPath}/dist`, resolve));

const createReleasePackage = async () =>
  merge([
    gulp.src(`${rootPath}/dist-src/*`),
    gulp.src(`${rootPath}/docker-compose.yml`),
    gulp.src(`${rootPath}/.env-default`),
    gulp.src(`${rootPath}/CHANGELOG.md`)
  ])
    .pipe(archiver(`${version.full}@${version.full}+${version.full}.tar`))
    .pipe(gulp.dest(`${rootPath}/dist`));

const execCommands = (headline, commands) =>
  async done => {
    cliPrint.headline(headline.replace('$VERSION', version.full));
    let returner;
    commands
      .every(command => {
        try {
          execSync(command.replace('$VERSION', version.full));
        } catch (e) {
          returner = cliPrint.get.error(`Git command '${command}' failed with: ${e}`);
          return false;
        }
        return true;
      });
    done(returner);
  };

const createCommit = execCommands(
  'Create commit tag version $VERSION',
  [
    'git add -A',
    'git ls-files --deleted | xargs git add',
    'git commit -m "Update version to $VERSION"',
    'git tag $VERSION'
  ]
);

// when using the task runner, this should be done by the host, since the task-runner don't have the credentials
const pushCommit = execCommands(
  'Push to master and to $VERSION',
  [
    'git push origin master',
    'git push origin $VERSION'
  ]
);

const createRelease = gulp.series(
  getUpdateSh,
  clearDistDir,
  createReleasePackage
);

exports.tagPrepare = gulp.series(
  updateVersion,
  checkPrerequisites,
  savePackageJson,
  updateVersionInFiles
);

exports.tagRevoke = gulp.series(
  revokeTag
);

exports.tagCommitRelease = gulp.series(
  createRelease,
  createCommit
);
