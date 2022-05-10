/* eslint-disable no-console,import/no-extraneous-dependencies,implicit-arrow-linebreak */
const fs = require('fs');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const { execSync } = require('child_process');
const merge = require('merge-stream');
const download = require('gulp-download2');
const archiver = require('@bytestream/gulp-archiver');
const cliPrint = require('./helper/cli-print');

const packageJson = require('../package.json');

// const tmpDir = fs.realpathSync(`${__dirname}'/../tmp`);
// const docsDir = fs.realpathSync(`${__dirname}'/../docs`);
// const sampledataDir = fs.realpathSync(`${__dirname}'/../sampledata`);
const rootPath = fs.realpathSync(`${__dirname}'/..`);

// see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// eslint-disable-next-line max-len
const semVerRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const version = {};

exports.getVersion = async done => {
  const [tagType, newLabel] = process.argv.pop().split('-');
  cliPrint.headline(`Tag new version: ${tagType}`);
  [version.old, version.major, version.minor, version.patch, version.label] = packageJson.version.match(semVerRegex);
  if (typeof version[tagType] !== 'undefined') {
    version[tagType] = parseInt(version[tagType], 10) + 1;
    version.label = '';
  }
  if (newLabel) {
    version.label = newLabel;
  }
  version.new = `${version.major}.${version.minor}.${version.patch}${version.label ? `-${version.label}` : ''}`;

  console.log(`Current version ${version.old}`);
  console.log(`Target version ${version.new}`);
  done();
};

exports.checkPrerequisites = async done => {
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
  cliPrint.success('[x] up to date with remote branch');

  // everything committed?
  // const committed = execSync('git status --porcelain').toString().trim();
  // if (committed !== '') {
  //   done(new Error(cliPrint.get.error('ERROR: Not everything committed')));
  // }
  // cliPrint.success('[x] everything committed');

  /*
      # port 80 in use?
    if is_port_in_use(80):
        sys.exit('ERROR: Port 80 in use!' + result.stderr)

   */

  // TODO changelog done

  // TODO tag exists

  done();
};

exports.updateVersionInFiles = async done => {
  cliPrint.headline('Update Shit');
  // gulp.src([
  //   `${rootPath}/package.json`,
  //   `${rootPath}/package-lock.json`,
  //   `${rootPath}/defintions/*.xsd`,
  //   `${rootPath}/sampledata/*.xml`
  // ]);

  packageJson.version = version.new;
  fs.writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));
  cliPrint.success('[x] update package.json');

  // TODO package-lock.json

  // TODO example files

  // todo sql patch

  done();
};

const updateFiles = (glob, regex, replacement) =>
  () => gulp.src(glob)
    .pipe(gulp.replace(regex, replacement))
    .pipe(gulp.dest('./'))
    .pipe(gulp.forEach(file => console.log(`[x] ${file} updated`)));

const updateVersionInFiles2 =
  gulp.series(
    updateFiles(
      `${rootPath}/sampledata/*.xml`,
      /xsi:noNamespaceSchemaLocation="https:\/\/raw\.githubusercontent\.com\/iqb-berlin\/testcenter\/(\d+.\d+.\d+)/g,
      packageJson.version
    )
    // updateFiles(
    //   `${rootPath}/defintions/*.xsd`,
    //   /xsi:noNamespaceSchemaLocation="https:\/\/raw\.githubusercontent\.com\/iqb-berlin\/testcenter\/(\d+.\d+.\d+)/g,
    //   packageJson.version
    // )
  );

exports.revoke = async done => {
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
    .pipe(archiver(`${packageJson.version}@${packageJson.version}+${packageJson.version}.tar`))
    .pipe(gulp.dest(`${rootPath}/dist`));

const commit = async done => {
  cliPrint.headline(`Commit and tag version ${packageJson.version}`);

  let returner;
  [
    'git add -A',
    'git ls-files --deleted | xargs git add',
    `git commit -m "Update version to ${packageJson.version}"`,
    'git push origin master',
    `git tag ${packageJson.version}`,
    `git push origin ${packageJson.version}`
  ]
    .every(command => {
      try {
        execSync(command);
      } catch (e) {
        returner = cliPrint.get.error(`Git command '${command}' failed with: ${e}`);
        return false;
      }
      return true;
    });
  done(returner);
};

exports.updateComposeFiles = async done => {
  cliPrint.headline('Update version in docker-compose.prod.yml');
  const file = `${rootPath}/dist-src/docker-compose.prod.yml`;
  const fileContent = fs.readFileSync(file).toString('utf-8');
  const newContent = fileContent
    .replaceAll(/(iqbberlin\/testcenter-(backend|frontend|broadcasting-service)):(.*)/g, `$1:${version.new}`);
  fs.writeFileSync(file, newContent);
  done();
};

exports.tag = gulp.series(
  exports.getVersion,
  exports.checkPrerequisites,
  exports.updateVersionInFiles,
  updateVersionInFiles2,
  exports.updateComposeFiles
);

exports.tagRevoke = gulp.series(
  exports.revoke
);

exports.createRelease = gulp.series(
  getUpdateSh,
  clearDistDir,
  createReleasePackage
);

exports.tagCommitRelease = gulp.series(
  exports.createRelease,
  commit
);
