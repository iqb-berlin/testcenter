/* eslint-disable no-param-reassign, max-len */
// eslint-disable-next-line import/no-unresolved
const dreddHooks = require('hooks');
const fs = require('fs');
const { Readable } = require('stream');
const Multipart = require('../../node_modules/multi-part');
const streamToString = require('../../node_modules/stream-to-string');

const skipAfterFirstFail = true; // change this to debug
let errorOccurred = false;

const sampledataDir = fs.realpathSync(`${__dirname}'/../../sampledata`);

const changeAuthToken = (transaction, newAuthTokenData) => {
  if (typeof transaction.request.headers.AuthToken === 'undefined') {
    return;
  }

  let authToken = '';
  const tokenType = transaction.request.headers.AuthToken.split(':')[0];

  switch (tokenType) {
    case 'a':
      authToken = newAuthTokenData.adminToken;
      break;
    case 'p':
      authToken = newAuthTokenData.personToken;
      break;
    case 'l':
      authToken = newAuthTokenData.loginToken;
      break;
    case 'g':
      authToken = newAuthTokenData.groupMonitorToken;
      break;
    case 'm':
      authToken = newAuthTokenData.groupMonitorToken;
      break;
    case 's':
      authToken = newAuthTokenData.studyMonitorToken;
      break;
    default:
  }

  transaction.request.headers.AuthToken = authToken;
};

const changeBody = (transaction, changeMap) => {
  if (!transaction.request.body) {
    return;
  }

  const body = JSON.parse(transaction.request.body);

  Object.keys(changeMap).forEach(key => {
    if (typeof body[key] !== 'undefined') {
      body[key] = changeMap[key];
    }
  });

  transaction.request.body = JSON.stringify(body);
};

const changeUri = (transaction, changeMap) => {
  Object.keys(changeMap).forEach(key => {
    // eslint-disable-next-line no-param-reassign
    transaction.request.uri = transaction.request.uri.replace(key, changeMap[key]);
    // eslint-disable-next-line no-param-reassign
    transaction.fullPath = transaction.fullPath.replace(key, changeMap[key]);
  });
};

const beforeEach = async (transaction, done) => {
  try {
    // skip everything after first failed test
    if (errorOccurred && skipAfterFirstFail) {
      // eslint-disable-next-line no-param-reassign
      transaction.skip = true;
      return done();
    }

    // use virtual environment
    transaction.request.headers.TestMode = 'api';

    // start debugging session
    transaction.request.uri += '?XDEBUG_SESSION_START=IDEA';

    // inject login credentials if necessary
    switch (transaction.expected.statusCode) {
      case '200':
      case '201':
      case '205':
      case '207':
      case '413':
        changeAuthToken(transaction, {
          adminToken: 'static:admin:super',
          loginToken: 'static:login:test',
          personToken: 'static:person:sample_group_test_xxx',
          groupMonitorToken: 'static:person:sample_group_test-group-monitor_',
          studyMonitorToken: 'static:person:study_group_test-study-monitor_'
        });
        break;
      case '400':
        changeBody(transaction, {
          password: '__totally_invalid_password__',
          code: '__invalid_code__'
        });
        changeAuthToken(transaction, {
          loginToken: 'static:login:test',
          adminToken: 'static:admin:super'
        });
        break;
      case '401':
        changeAuthToken(transaction, {});
        break;
      case '403':
        changeAuthToken(transaction, {
          adminToken: '__invalid_token__',
          loginToken: '__invalid_token__',
          personToken: '__invalid_token__',
          groupMonitorToken: '__invalid_token__',
          studyMonitorToken: '__invalid_token__'
        });
        changeUri(transaction, {
          '/static%3Agroup%3Asample_group/': '/__invalid_token__/'
        });
        break;
      case '404':
        changeAuthToken(transaction, {
          adminToken: 'static:admin:super',
          loginToken: 'static:login:test',
          personToken: 'static:person:sample_group_test_xxx',
          groupMonitorToken: 'static:person:sample_group_test-group-monitor_',
          studyMonitorToken: 'static:person:study_group_test-study-monitor_'
        });
        changeUri(transaction, {
          '/workspace/1': '/workspace/13',
          '/group/sample_group': '/group/invalid_group',
          '/test/1/connection-lost': '/test/13/connection-lost',
          '/SAMPLE_UNITCONTENTS.HTM': '/not-existing-unit'
        });
        break;
      case '410':
        changeAuthToken(transaction, {
          adminToken: 'static:admin:expired_user',
          loginToken: 'static:login:test-expired',
          personToken: 'static:person:expired_group_test-expired_xxx',
          groupMonitorToken: 'static:person:expired_group_expired-group-monitor_',
          studyMonitorToken: 'static:person:expired_group_expired-study-monitor_'
        });
        break;
      default:
        transaction.skip = true;
        return done();
    }

    // Set Accept header
    const contentType = String(transaction.expected.headers['Content-Type']);
    const contentTypeArray = contentType.split(';', 1);
    if (contentTypeArray.length > 0) {
      // eslint-disable-next-line no-param-reassign
      transaction.request.headers.Accept = contentTypeArray[0];
    }
  } catch (e) {
    transaction.fail = e;
  }

  return done();
};

const beforeEachValidation = async (transaction, done) => {
  // nginx an apache use different spellings for this - so normalize
  ['content-type', 'Content-Type']
    .forEach(spellingVariant => {
      if (transaction.real.headers[spellingVariant]) {
        transaction.real.headers[spellingVariant] = transaction.real.headers[spellingVariant].toLowerCase().replace('; ', ';');
      }
    });
  done();
};

const attachUploadFile = async (transaction, done) => {
  try {
    const form = new Multipart();
    form.append('fileforvo', fs.createReadStream(`${sampledataDir}/Unit.xml`, 'utf-8'), { filename: 'SAMPLE_UNIT.XML' });
    transaction.request.body = await streamToString(form.stream());
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];
  } catch (e) {
    transaction.fail = e;
  }
  done();
};

const addInvalidUploadFile = async (transaction, done) => {
  try {
    const form = new Multipart();
    form.append('fileforvo', fs.createReadStream(`${sampledataDir}/Unit.xml`, 'utf-8'), { filename: 'SAMPLE_UNIT.XML' });
    transaction.request.body = (await streamToString(form.stream()))
      .replace('<Unit', '<Invalid')
      .replace('</Unit', '</Invalid');
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];
  } catch (e) {
    transaction.fail = e;
  }
  done();
};

const addHugeFile = async (transaction, done) => {
  try {
    const form = new Multipart();
    const tooBigContent = Readable.from(['x'.repeat(1024)]);
    form.append('MAX_FILE_SIZE', '512');
    form.append('fileforvo', tooBigContent, { filename: 'HUGE_FILE.XML' });
    transaction.request.body = await streamToString(form.stream());
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];
  } catch (e) {
    transaction.fail = e;
  }
  done();
};

const addResourceToExpectation = async (transaction, done) => {
  transaction.expected.body = fs.readFileSync(`${sampledataDir}/SAMPLE_UNITCONTENTS.HTM`).toString();
  done();
};

const addBookletToExpectation = async (transaction, done) => {
  transaction.expected.body = fs.readFileSync(`${sampledataDir}/Booklet.xml`).toString();
  done();
};

const attachBOM = async (transaction, done) => {
  transaction.expected.body = `\uFEFF${transaction.expected.body}`;
  done();
};

const attachUploadImage = async (transaction, done) => {
  try {
    const form = new Multipart();
    form.append('attachment', Readable.from(['image data']), { filename: 'image.png' });
    form.append('type', 'image');
    transaction.request.body = await streamToString(form.stream());
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];
  } catch (e) {
    transaction.fail = e;
  }
  done();
};

const finishAfterError = (transaction, done) => {
  // die after first failure
  if (transaction.results.valid === false) {
    errorOccurred = true;
  }
  done();
};

dreddHooks.beforeEach(beforeEach);
dreddHooks.beforeEachValidation(beforeEachValidation);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 201 > application/json', attachUploadFile);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 207 > application/json', addInvalidUploadFile);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 401', attachUploadFile);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 403', attachUploadFile);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 404', attachUploadFile);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 410', attachUploadFile);
dreddHooks.before('specs > /workspace/{ws_id}/file > upload file > 413', addHugeFile);
dreddHooks.beforeValidation('specs > /file/{group_token}/{+path} > get file by path > 200 > text/html;charset=utf-8', addResourceToExpectation);
dreddHooks.beforeValidation('/file/{group_token}/{+path} > get file by path > 200 > text/html;charset=utf-8', addResourceToExpectation);
dreddHooks.beforeValidation('specs > /workspace/{ws_id}/report/log > get report of logs > 200 > text/csv;charset=utf-8', attachBOM);
dreddHooks.beforeValidation('specs > /workspace/{ws_id}/report/response > get report of item responses > 200 > text/csv;charset=utf-8', attachBOM);
dreddHooks.beforeValidation('specs > /workspace/{ws_id}/report/review > get report of item reviews > 200 > text/csv;charset=utf-8', attachBOM);
dreddHooks.beforeValidation('specs > /reviews/export > get all reviews of a person > 200 > text/csv;charset=utf-8', attachBOM);
dreddHooks.beforeValidation('specs > /workspace/{ws_id}/report/sys-check > get report of system checks > 200 > text/csv;charset=utf-8', attachBOM);
dreddHooks.beforeValidation('specs > /booklet/{booklet_name} > get a booklet > 200 > application/xml', addBookletToExpectation);
dreddHooks.before('specs > /attachment/{attachment_id}/file > upload a new attachment-file > 201', attachUploadImage);
dreddHooks.before('specs > /attachment/{attachment_id}/file > upload a new attachment-file > 401', attachUploadImage);
dreddHooks.before('specs > /attachment/{attachment_id}/file > upload a new attachment-file > 403', attachUploadImage);
dreddHooks.before('specs > /attachment/{attachment_id}/file > upload a new attachment-file > 404', attachUploadImage);
dreddHooks.before('specs > /attachment/{attachment_id}/file > upload a new attachment-file > 410', attachUploadImage);
dreddHooks.afterEach(finishAfterError);
