const hooks = require('hooks');

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

hooks.after('/login.php/login > Login > 200 > application/json', function(transaction, done) {

    // store login credentials
    stash.authToken = JSON.parse(transaction.real.body).admintoken;
    hooks.log("stashing auth token:" + stash.authToken );
    done();
});
