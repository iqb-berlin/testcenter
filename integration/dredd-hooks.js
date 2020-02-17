const dreddHooks = require('hooks');
const fs = require('fs');
const Multipart = require('multi-part');
const streamToString = require('stream-to-string');

const stash = {};
let skipTheRest = false;


const changeAuthToken = (transaction, newAuthTokenData) => {

    if (typeof transaction.request.headers['AuthToken'] !== "undefined") {
        newAuthTokenData.ws = transaction.request.headers['AuthToken'].ws; // for depricated endpoints
        transaction.request.headers['AuthToken'] = JSON.stringify(newAuthTokenData);
    }
};

dreddHooks.beforeEachValidation(function(transaction) {

    // don't compare headers
    transaction.real.headers = {};
    transaction.expected.headers = {};
});


dreddHooks.beforeEach(function(transaction, done) {

    // skip everything after first failed test
    if (skipTheRest) {
        transaction.skip = true;
        return done();
    }

    // inject login credentials if necessary
    switch (transaction.expected.statusCode) {
        case '200':
        case '207':
            changeAuthToken(transaction,{at: stash.authToken});
            break;
        case '401':
            changeAuthToken(transaction,{});
            break;
        case '403':
            changeAuthToken(transaction,{at: '__invalid_token__'});
            break;
        default:
            transaction.skip = true;
            return done();
    }

    // make sure, sample files are available
    [
        {src: '../sampledata/Unit.xml', target: '../vo_data/ws_1/Unit/SAMPLE_UNIT.XML'},
        {src: '../sampledata/SysCheck.xml', target: '../vo_data/ws_1/SysCheck/SAMPLE_SYSCHECK.XML'}
    ].forEach(copyFile => {
        if (!fs.existsSync(copyFile.target)) {
            fs.copyFileSync(copyFile.src, copyFile.target);
            fs.chmodSync(copyFile.target, '777');
        }
    });

    done();
});

dreddHooks.afterEach(function(transaction, done) {

    // die after first failure
    if (transaction.results.valid === false) {
        skipTheRest = true;
    }

    // store login credentials if we come from any login endpoint
    try {
        const responseBody = JSON.parse(transaction.real.body);
        if (typeof responseBody.admintoken !== "undefined") {
            stash.authToken = JSON.parse(transaction.real.body).admintoken;
            dreddHooks.log("stashing auth token:" + stash.authToken);
        }
    } catch (e) {
        // do nothing, this is most likely not a JSON request
    }

    done();
});

dreddHooks.before('/php/getFile.php > get file > 200', function(transaction, done) {

    const atParameterRegex = /at=[\w\\.]+/gm;
    dreddHooks.log("replacing auth token:" + stash.authToken);
    transaction.fullPath = transaction.fullPath.replace(atParameterRegex, 'at=' + stash.authToken);
    transaction.expected.body = fs.readFileSync('../vo_data/ws_1/Unit/SAMPLE_UNIT.XML', 'utf-8').toString();
    done();
});

dreddHooks.before('/php/getFile.php > get file > 200 > application/octet-stream', function(transaction, done) {

    transaction.skip = true;
    done();
});

const attachUnitFile = async function(transaction, done) {

    const form = new Multipart();

    form.append('fileforvo', fs.createReadStream('../vo_data/ws_1/Unit/SAMPLE_UNIT.XML', 'utf-8'));

    transaction.request.body = await streamToString(form.stream());
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];
    done();
};

dreddHooks.before('/php/uploadFile.php > upload file > 200 > application/json', attachUnitFile);
dreddHooks.before('/workspace/{ws_id}/file > upload file > 200 > application/json', attachUnitFile);

dreddHooks.after('get reports > GET > 200 > text/csv', function(transaction, done) {

    //because of timestamps in the end
    transaction.expected.body = transaction.expected.body.substring(0, transaction.expected.body.length - 64);
    transaction.real.body = transaction.real.body.substring(0, transaction.real.body.length - 64);
    done();
});
