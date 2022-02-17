module.exports = {

    headline: text => console.log(`\x1b[37m\x1b[44m${text}\x1b[0m`),
    getError: text => new Error(`\x1B[31m${text}\x1B[34m`),
    red: text => `\x1B[31m${text}\x1B[34m`,
};
