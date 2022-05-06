/* eslint-disable no-console */
const styles = {
  headline: text => `\x1b[37m\x1b[44m${text}\x1b[0m`,
  error: text => `\x1B[31m${text}\x1B[34m`,
  success: text => `\x1b[32m${text}\x1b[0m`
};

module.exports = {
  get: styles,
  headline: x => console.log(styles.headline(x)),
  error: x => console.log(styles.error(x)),
  success: x => console.log(styles.success(x))
};
