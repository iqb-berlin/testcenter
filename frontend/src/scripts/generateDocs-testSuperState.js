/* eslint-disable no-console,@typescript-eslint/no-var-requires */
const fs = require('fs');
const { superStates } = require('../app/group-monitor/test-session/super-states');

const mdTargetFilename = '../../docs/super-states.html';

console.log('writing html documentation');

let content = '';

Object.keys(superStates).forEach(key => {
  const className = (typeof superStates[key].class !== 'undefined') ? superStates[key].class : '';
  content += `
<table>
  <tr>
    <td rowspan="3"><i class="${className} material-icons">${superStates[key].icon}</i></td>
    <td><strong>${key}</strong></td>
  </tr>
  <tr>
    <td>Tooltip: <code>${superStates[key].tooltip}</code></td>
  </tr>
   <tr>
    <td>${superStates[key].description}</td>
  </tr>
</table>
<br>
  `;
});

const docFile = `
<!DOCTYPE html>
<html lang="de">
  <meta charset="utf-8">
  <title>States of Running Tests</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    body {
      font-family: sans-serif;
    }
    i {
      font-family: "Material Icons";
      font-style: normal;
      font-size: xx-large;
    }
    i.warning {
      color: #821123;
    }
    i.danger {
      color: #821123;
    }
    i.success {
      color: #b2ff59 !important
    }
  </style>
</html>
<body>
  <h1>States of Running Tests</h1>
  <p>
    These are the different states of running tests which can be shown by the group-monitor.
  </p>
  <p>
    Background: There are plenty of different combinations of state-values of a running test: Some states are reported 
    by the frontend, like <quote>CONTROLLER</quote>, some come from the backend like if the test is locked. 
    State means a set of values represenatating, wether the test is started, which unit was shown last, the remaining 
    time, an error if there is any, wether it is locked and so on. Various combinations are possible: a test can be 
    locked and paused at the same time for example. Those things are boiled down to the following states 
    (internally called super-states) to be displayed to be more convinient for the user. The order means the importance:
    if there is a error, the super-state will be <quote>error</quote>, regardless of if the test is paused or not.
  </p>
  ${content}
</body>
`;

fs.writeFileSync(mdTargetFilename, docFile, 'utf8');
console.log('done.');
