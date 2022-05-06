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
  const committed = execSync('git status --porcelain').toString().trim();
  if (committed !== '') {
    done(new Error(cliPrint.get.error('ERROR: Not everything committed')));
  }
  cliPrint.success('[x] everything committed');

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

  packageJson.version = version.new;
  fs.writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));
  cliPrint.success('[x] update package.json');

  // TODO package-lock.json

  // todo sql patch

  done();
};

exports.revoke = async done => {
  cliPrint.headline('Revoke to previous state after failure');
  try {
    execSync('git reset --hard').toString().trim();
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
    .pipe(archiver(`${version.new}@${version.new}+${version.new}.tar`))
    .pipe(gulp.dest(`${rootPath}/dist`));

const commit = async done => {
  cliPrint.headline('commit');
  done();
};

  /*
  def git_tag_commit_and_push(backend_version, frontend_version, bs_version):
    """Add updated compose files and submodules hashes and commit them to repo."""
    new_version_string = f"{frontend_version}@{backend_version}+{bs_version}"
    print(f"Creating git tag for version {new_version_string}")
    subprocess.run("git add testcenter-backend", shell=True, check=True)
    subprocess.run("git add testcenter-frontend", shell=True, check=True)
    subprocess.run("git add testcenter-broadcasting-service", shell=True, check=True)
    # remove old release package from git
    subprocess.run("git ls-files --deleted | xargs git add", shell=True, check=True)
    # Add files to commit: compose files and release package
    for compose_file in COMPOSE_FILE_PATHS:
        subprocess.run(f"git add {compose_file}", shell=True, check=True)
    subprocess.run("git add dist/*", shell=True, check=True)

    subprocess.run(f"git commit -m \"Update version to {new_version_string}\"", shell=True, check=True)
    subprocess.run("git push origin master", shell=True, check=True)

    subprocess.run(f"git tag {new_version_string}", shell=True, check=True)
    subprocess.run(f"git push origin {new_version_string}", shell=True, check=True)
   */

exports.updateComposeFiles = async done => {
  /*
      backend_pattern = re.compile('(?<=iqbberlin\\/testcenter-backend:)(.*)')
    frontend_pattern = re.compile('(?<=iqbberlin\\/testcenter-frontend:)(.*)')
    bs_pattern = re.compile('(?<=iqbberlin\\/testcenter-broadcasting-service:)(.*)')
    for compose_file in COMPOSE_FILE_PATHS:
        with open(compose_file, 'r') as f:
            file_content = f.read()
        new_file_content = backend_pattern.sub(backend_version, file_content)
        new_file_content = frontend_pattern.sub(frontend_version, new_file_content)
        new_file_content = bs_pattern.sub(bs_version, new_file_content)
        with open(compose_file, 'w') as f:
            f.write(new_file_content)

   */
  done();
};

exports.tag = gulp.series(
  exports.getVersion,
  exports.checkPrerequisites,
  exports.updateVersionInFiles
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
