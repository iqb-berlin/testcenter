const dreddHooks = require('hooks');
const fs = require('fs');
const Multipart = require('multi-part');
const streamToString = require('stream-to-string');

const stash = {};

dreddHooks.beforeEachValidation(function(transaction) {

    // don't compare headers
    transaction.real.headers = {};
    transaction.expected.headers = {};
});

dreddHooks.beforeEach(function(transaction, done) {

    // dont' check error responses
    if (transaction.expected.statusCode.substr(0,1) !== "2") {
        transaction.skip = true;
    }

    // ['../sampledata', '../sampledata/Unit.xml', '../vo_data', '../vo_data/ws_1', '../vo_data/ws_1/Unit'] // STAND 2 hier klappt auf travis was nicht
    //     .forEach((file => {
    //         dreddHooks.log('FILE ' + file + (fs.existsSync(file) ? ' EXISTS' : 'DOES NOT EXIST'));
    //     }));

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

    // use login credentials
    if (typeof transaction.request.headers['AuthToken'] !== "undefined") {
        const authToken = transaction.request.headers['AuthToken'];
        authToken.at = stash.authToken;
        transaction.request.headers['AuthToken'] = JSON.stringify(authToken);
    }
    transaction.request.headers['Accept'] = "*/*";
    done();
});

dreddHooks.afterEach(function(transaction, done) {

    // store login credentials if we come from any login endpoint
    try {
        const responseBody = JSON.parse(transaction.real.body);
        if (typeof responseBody.admintoken !== "undefined") {
            stash.authToken = JSON.parse(transaction.real.body).admintoken;
            dreddHooks.log("stashing auth token:" + stash.authToken);
        }
    } catch (e) {
        // do nothing, this is most likey not a JSOn request
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
