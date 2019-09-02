/**
 * This is Mini-Server to help developing the API & API Specification.
 */

const gulp        = require('gulp');
const browserSync = require('browser-sync').create();


function sync_spec_docs() {

    browserSync.init({
        server: '../specs',
        serveStatic: [
            {
                route: '/integration/node_modules/redoc/bundles',
                dir: 'node_modules/redoc/bundles'
            },
            {
                route: '/',
                dir: '../docs/api/admin'
            },
            {
                route: '/specs',
                dir: '../specs'
            },
        ]
    });

    gulp.watch("../specs/**", gulp.series(reload));

}

function reload(done) {
    browserSync.reload();
    done();
}

exports.sync_spec_docs = sync_spec_docs;
