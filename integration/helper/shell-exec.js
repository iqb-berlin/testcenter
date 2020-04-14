const {spawnSync} = require('child_process');

const red = text => `\x1B[31m${text}\x1B[34m`;
module.exports = (command, params = []) => {

    const process = spawnSync(command, params);

    if (process.status == null) {
        return {
            success: false,
            output: red(`Could not execute command: ${command}`)
        };
    }

    if (process.status > 0) {
        return {
            success: false,
            output: `[${process.status}] ${process.stdout.toString()}\n` + red(process.stderr.toString())
        };
    }

    return {
        success: true,
        output: process.stdout.toString()
    };
};
