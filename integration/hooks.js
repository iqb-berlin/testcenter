const hooks = require('hooks');
const fs = require('fs');
const Multipart = require('multi-part');
const streamToString = require('stream-to-string');

const stash = {};

hooks.beforeEachValidation(function(transaction) {

    // don't compare headers
    transaction.real.headers = {};
    transaction.expected.headers = {};
});

hooks.beforeEach(function(transaction, done) {

    // dont' check error responses
    if (transaction.expected.statusCode.substr(0,1) !== "2") {
        transaction.skip = true;
    }

    // use login credentials
    if (typeof transaction.request.headers['AuthToken'] !== "undefined") {
        let authToken =transaction.request.headers['AuthToken'];
        authToken.at = stash.authToken;
        transaction.request.headers['AuthToken'] = JSON.stringify(authToken);
    }
    transaction.request.headers['Accept'] = "*/*";
    done();
});

hooks.after('/php/login.php/login > Login > 200 > application/json', function(transaction, done) {

    // store login credentials
    stash.authToken = JSON.parse(transaction.real.body).admintoken;
    hooks.log("stashing auth token:" + stash.authToken );
    done();
});

hooks.before('/php/getFile.php > get file > 200 > text/xml', function(transaction, done) {

    const atParameterRegex = /at=[\w\\.]+/gm;
    transaction.fullPath = transaction.fullPath.replace(atParameterRegex, 'at=' + stash.authToken);
    transaction.expected.body = fs.readFileSync('../vo_data/ws_1/Unit/SAMPLE_UNIT.XML', 'utf-8').toString();
    done();
});

hooks.before('/php/getFile.php > get file > 200 > application/octet-stream', function(transaction, done) {

    transaction.skip = true;
    done();
});

hooks.before('/php/uploadFile.php > upload file > 200 > text/plain', async function(transaction, done) {

    const form = new Multipart();

    form.append('fileforvo', fs.createReadStream('../vo_data/ws_1/Unit/SAMPLE_UNIT.XML', 'utf-8'));

    transaction.request.body = await streamToString(form.stream());
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];

    hooks.log('-.-.-.-.-');
    hooks.log(transaction.request);
    hooks.log(transaction.request.body);
    hooks.log('-.-.-.-.-');

    // transaction.request.body = fs.readFileSync('../vo_data/ws_1/Unit/SAMPLE_UNIT.XML', 'utf-8').toString();
    done();
});
