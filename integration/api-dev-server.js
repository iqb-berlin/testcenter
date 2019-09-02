/**
 * This is Mini-Server to help developing the API & API Specification.
 */

const gulp        = require('gulp');
const browserSync = require('browser-sync').create();
const run         = require('gulp-run');


function browser_sync() {

    browserSync.init({
        server: "../docs/api/admin"
    });

    gulp.watch("../specs/**", gulp.series(create_docs, update_browser));

}

function update_browser() {

    gulp.src("../docs/api/admin/")
        .pipe(browserSync.stream());
}

function create_docs() {
    return run("npm run create_docs").exec();
}


exports.browser_sync = browser_sync;
