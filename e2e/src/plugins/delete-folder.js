/* eslint-disable no-console */
const fs = require('fs');

module.exports = function deleteFolder(folderName) {
  console.log('deleting folder %s', folderName);
  if (!fs.existsSync(folderName)) {
    return null;
  }
  fs.rmdirSync(folderName, { maxRetries: 10, recursive: true });
  return null;
};
