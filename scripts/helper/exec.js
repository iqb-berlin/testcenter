/**
 * Execs a shell-command synchronously and returns the output.
 */

const { execSync } = require('child_process');

exports.exec = command => execSync(command, { cwd: '/app' }).toString().trim();
