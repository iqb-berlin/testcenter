var hooks = require('hooks');

hooks.beforeEachValidation(function(transaction) {

    // don't compare headers
    transaction.real.headers = {};
    transaction.expected.headers = {};
});


hooks.before('/login > Login > 401', function (transaction, done) {
    transaction.skip = true;
    done();
});

hooks.before('/login > Login > 404', function (transaction, done) {
    transaction.skip = true;
    done();
});

hooks.before('/login > Login > 406', function (transaction, done) {
    transaction.skip = true;
    done();
});

hooks.before('/login > Login > 500', function (transaction, done) {
    transaction.skip = true;
    done();
});
