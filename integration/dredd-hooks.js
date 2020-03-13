const dreddHooks = require('hooks');
const fs = require('fs');
const Multipart = require('multi-part');
const streamToString = require('stream-to-string');


const skipAfterFirstFail = true; // change this to debug
let skipTheRest = false;


const changeAuthToken = (transaction, newAuthTokenData) => {

    let authToken = {};

    if (typeof transaction.request.headers['AuthToken'] !== "undefined") {
        authToken = transaction.request.headers['AuthToken'];
    }

    if (typeof authToken['at'] !== "undefined") {
        authToken['at'] = newAuthTokenData.adminToken;
    }

    if (typeof authToken['p'] !== "undefined") {
        authToken['p'] = newAuthTokenData.personToken;
    }

    if (typeof authToken['l'] !== "undefined") {
        authToken['l'] = newAuthTokenData.loginToken;
    }

    transaction.request.headers['AuthToken'] = JSON.stringify(authToken);
};


dreddHooks.beforeEachValidation(function(transaction) {

    // don't compare headers
    transaction.real.headers = {};
    transaction.expected.headers = {};
});


dreddHooks.beforeEach(function(transaction, done) {

    // skip everything after first failed test
    if (skipTheRest && skipAfterFirstFail) {
        transaction.skip = true;
        return done();
    }

    transaction.request.headers['TestMode'] = true; // use virtual environment

    // inject login credentials if necessary
    switch (transaction.expected.statusCode) {
        case '200':
        case '201':
        case '207':
            changeAuthToken(transaction, {
                adminToken: 'static_token_admin',
                loginToken: 'static_token_login',
                personToken: 'static_token_person'
            });
            break;
        case '401':
            changeAuthToken(transaction,{});
            break;
        case '403':
            changeAuthToken(transaction,{
                adminToken: '__invalid_token__',
                loginToken: '__invalid_token__',
                personToken: '__invalid_token__'
            });
            break;
        default:
            transaction.skip = true;
            return done();
    }

    done();
});

dreddHooks.afterEach(function(transaction, done) {

    // die after first failure
    if (transaction.results.valid === false) {
        skipTheRest = true;
    }

    // store login credentials if we come from any endpoint providing some
    try {
        const responseBody = JSON.parse(transaction.real.body);
        if (typeof responseBody.adminToken !== "undefined") {
            stash.adminToken = JSON.parse(transaction.real.body).adminToken;
            dreddHooks.log("stashing AdminAuthToken:" + stash.adminToken);
        }
        if (typeof responseBody.personToken !== "undefined") {
            stash.personToken = JSON.parse(transaction.real.body).personToken;
            dreddHooks.log("stashing PersonAuthToken:" + stash.personToken);
        }
        if (typeof responseBody.loginToken !== "undefined") {
            stash.loginToken = JSON.parse(transaction.real.body).loginToken;
            dreddHooks.log("stashing LoginAuthToken:" + stash.loginToken);
        }
    } catch (e) {
        // do nothing, this is most likely not a JSON request
    }

    done();
});

dreddHooks.before('/workspace/{ws_id}/file > upload file > 201 > application/json', async function(transaction, done) {

    const form = new Multipart();

    dreddHooks.log('A');

    form.append('fileforvo', fs.createReadStream('../sampledata/Unit.xml', 'utf-8'));

    dreddHooks.log('B');

    transaction.request.body = await streamToString(form.stream());
    transaction.request.headers['Content-Type'] = form.getHeaders()['content-type'];
    done();
});
