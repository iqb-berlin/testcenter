const browserslist = require('browserslist');
const packageJSON = require('../package.json');

// '# automatically generated from package.json'


const browsers = browserslist(packageJSON.browserslist);
console.log(browsers.join(', '));
