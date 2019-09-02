/**
 * This is Mini-Server to help developing the API & API Specification.
 */

const gulp        = require('gulp');
const browserSync = require('browser-sync').create();


function sync_spec_docs() {

    browserSync.init({
        server: "../docs/api/admin",
        serveStatic: [
            {
                route: '/integration/node_modules/redoc/bundles',
                dir: 'node_modules/redoc/bundles'
            },
            {
                route: '/specs',
                dir: '../specs'
            },
        ]
    });

    gulp.watch("../specs/**", gulp.series(update_browser));

}

function update_browser() {

    gulp.src("../docs/api/admin/")
        .pipe(browserSync.stream());
}

exports.sync_spec_docs = sync_spec_docs;
