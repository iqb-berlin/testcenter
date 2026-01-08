import Chainable = Cypress.Chainable;

export const cleanUp = (): Chainable =>  {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();
  Cypress.env('alias_storage', {});
  return cy.visit('about:blank');
};

export const deleteDownloadsFolder = () => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.task('deleteFolder', downloadsFolder);
};

export const visitLoginPage = () => {
  const loginUrl = `${Cypress.config().baseUrl}/#/r/login/?testMode=true`;
  cy.visit(loginUrl);
  cy.get('[data-cy="login-admin"]')
    .should('be.visible');
  cy.get('[formcontrolname="name"]')
    .should(`be.visible`);
  cy.contains('Testmode!').should('be.visible');
  cy.url().should('include', '/#/r/login');
  cy.url().should('include', 'testMode=true');
  cy.log('✅ Test-Mode ist gesetzt.');
};

export const visitLoginPageWithProdDb = () => {
   cy.visit(`${Cypress.config().baseUrl}/#/r/login/`);
 };

export const probeBackendApi = () => {
    cy.intercept({ url: new RegExp(`${Cypress.env('urls').backend}/(system/config|sys-check-mode)`) })
      .as('waitForConfig');
    cy.visit(Cypress.config('baseUrl'));
    cy.wait('@waitForConfig', { timeout: 30000 });
  };

export const resetBackendData = () => {
  cy.log('🔄 Setze Backend-Daten zurück');
  cy.request({
    url: `${Cypress.env('urls').backend}/version`,
    headers: { TestMode: 'prepare-integration' }
  })
    .its('status')
    .should('eq', 200)
    .then(() => cy.log('✅ Version-Endpoint erfolgreich'));

  cy.request({
    url: `${Cypress.env('urls').backend}/flush-broadcasting-service`,
    headers: { TestMode: 'integration' }
  })
    .its('status')
    .should('eq', 200)
    .then(() => cy.log('✅ Broadcasting-Service geflushed'));
};

export const disableSimplePlayersInternalDebounce = (): Chainable => {
  return modifyPlayer([{
    replace: 'const overridePlayerSettings = (location.search);',
    with: 'const overridePlayerSettings = "?debounceStateMessages=0&debounceKeyboardEvents=0"'
  }]);
};

export const modifyPlayer = (rules: { replace: string | RegExp, with: string }[]): Chainable => {
  cy.intercept(
    {
      url: new RegExp(
        `${Cypress.env('urls').fileService}/file/static:group:[^\\/]+/ws_1/Resource/verona-player-simple-6.0.html`
      )
    },
    req => {
      req.headers.TestMode = 'integration';
      req.reply(res => {
        rules.forEach(rule => {
          res.body = res.body.replace(rule.replace, rule.with);
        });
      });
    }
  );
  return cy.wrap(null);
};

export const insertCredentials = (username: string, password = '') => {
  cy.get('[formcontrolname="name"]')
    .should(`be.visible`)
    .clear()
    .type(username);
  if (password) {
    cy.get('[formcontrolname="pw"]')
      .should(`be.visible`)
      .clear()
      .type(password);
  }
};

export const logoutAdmin = () => cy.url()
  .then(url => {
    if (url !== `${Cypress.config().baseUrl}/#/r/login/`) {
      cy.get('[data-cy="logo"]')
        .click();
      cy.url()
        .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
      cy.get('[data-cy="logout"]')
        .click();
      cy.get('[data-cy="login-admin"]').should('be.visible');
    }
    cy.get('[data-cy="login-admin"]').should('be.visible');
  });

export const logoutTestTakerHot = (): Chainable => {
  const baseUrl = Cypress.config().baseUrl;
  const backendUrl = Cypress.env('urls').backend;

  cy.intercept('GET', `${backendUrl}/session`).as('waitForGetSession');
  cy.intercept('DELETE', `${backendUrl}/session`).as('waitForDeleteSession');

  return cy.url().then(url => {
    const isOnStarterPage = url === `${baseUrl}/#/r/starter`;

    if (!isOnStarterPage) {
      cy.get('[data-cy="logo"]')
        .click();
    }

    cy.get('[data-cy="endTest-1"]').click();
    cy.wait('@waitForGetSession');
    cy.url().should('eq', `${baseUrl}/#/r/starter`);
    cy.contains('Status:').should('be.visible');
    cy.get('[data-cy="logout"]').click();
    cy.wait('@waitForDeleteSession');

    return cy.get('[data-cy="login-admin"]').should('be.visible');
  });
};

export const logoutTestTakerDemo = (): Chainable => {
  const baseUrl = Cypress.config().baseUrl;
  const backendUrl = Cypress.env('urls').backend;

  cy.intercept('DELETE', `${backendUrl}/session`).as('waitForDeleteSession');

  return cy.url().then(url => {
    const isOnStarterPage = url === `${baseUrl}/#/r/starter`;

    if (!isOnStarterPage) {
      cy.get('[data-cy="logo"]')
        .click();
    }
    cy.url().should('eq', `${baseUrl}/#/r/starter`);
    cy.contains('Status:').should('be.visible');
    cy.get('[data-cy="logout"]').click();
    cy.wait('@waitForDeleteSession');

    return cy.get('[data-cy="login-admin"]').should('be.visible');
  });
}

export const openSampleWorkspace = (workspace: number) => {
  cy.get(`[data-cy="workspace-${workspace}"]`)
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/${workspace}/files`);
};

export const openSampleWorkspace2 = () => {
  cy.get('[data-cy="workspace-2"]')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/2/files`);
};

export const loginSuperAdmin = () => {
  insertCredentials('super', 'user123');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  cy.get('[data-cy="card-login-name"]')
    .contains('super');
};

export const loginWorkspaceAdmin = (username: string, password: string) => {
  cy.intercept({ url: `${Cypress.env('urls').backend}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
  insertCredentials(username, password);
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  cy.get('[data-cy="card-login-name"]')
    .contains(username);
};

export const loginTestTaker =
  (name: string, password: string): void => {
    insertCredentials(name, password);
    cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/commands`)).as('commands');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.wait(['@commands']);
  };

export const loginMonitor =
  (name: string, password: string): void => {
    insertCredentials(name, password);
    cy.get('[data-cy="login-user"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="logout"]')
      .should('be.visible');
  };

export const clickSuperadminSettings = () => {
  cy.get('[data-cy="goto-superadmin-settings"]')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`);
};

export const addWorkspaceAdmin = (username: string, password: string) => {
  cy.get('[data-cy="superadmin-tabs:users"]')
    .click();
  cy.get('[data-cy="add-user"]')
    .click();
  cy.get('[formcontrolname="name"]')
    .type(username);
  cy.get('[formcontrolname="pw"]')
    // password < 7 characters
    .type('123456')
    .get('[type="submit"]')
    .should('be.disabled');
  cy.get('[formcontrolname="pw"]')
    .clear()
    .type(password);
  cy.intercept('PUT', `${Cypress.env('urls').backend}/user`).as('waitForNewUser');
  cy.get('[type="submit"]')
    .click();
  cy.wait('@waitForNewUser');
};

export const uploadFileFromFixtureToWorkspace = (fileName: string, workspace: number) => {
  loginSuperAdmin();
  openSampleWorkspace(workspace);
  cy.get('[data-cy="upload-file-select"]')
    .selectFile(`${Cypress.config('fixturesFolder')}/${fileName}`, { force: true });
  logoutAdmin();
};

export const deleteFilesSampleWorkspace = () => {
  cy.get('[data-cy="files-checkAll-Testtakers"]')
    .click();
  cy.get('[data-cy="files-checkAll-Booklet"]')
    .click();
  cy.get('[data-cy="files-checkAll-SysCheck"]')
    .click();
  cy.get('[data-cy="files-checkAll-Resource"]')
    .click();
  cy.get('[data-cy="files-checkAll-Unit"]')
    .click();
  cy.get('[data-cy="delete-files"]')
    .click();
  cy.get('[data-cy="dialog-title"]')
    .contains('Löschen von Dateien');
  cy.get('[data-cy="dialog-confirm"]')
    .contains('Löschen')
    .click();
  cy.contains('erfolgreich gelöscht.');
  cy.contains('Teilnehmerlisten')
    .should('not.exist');
  cy.contains('Testhefte')
    .should('not.exist');
  cy.contains('System-Check-Definitionen')
    .should('not.exist');
  cy.contains('Ressourcen')
    .should('not.exist');
};

export const deleteTesttakersFiles = (workspace: number) => {
  if (workspace === 1) {
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
  }
  if (workspace === 2) {
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
  }
  cy.get('[data-cy="delete-files"]')
    .click();
  cy.get('[data-cy="dialog-title"]')
    .contains('Löschen von Dateien');
  cy.get('[data-cy="dialog-confirm"]')
    .contains('Löschen')
    .click();
  cy.contains('erfolgreich gelöscht.');
  cy.contains('erfolgreich gelöscht.', { timeout: 10000 })
    .should('not.exist');
};

export const useTestDBSetDate = (timestamp: string) => {
  cy.intercept(new RegExp(`${Cypress.env('urls').backend}/.*`), req => {
    req.headers.TestClock = timestamp;
    req.headers.TestMode = 'integration';
  }).as('testClock');
};

export const getResultFileRows = (fileType: 'responses' | 'reviews' | 'logs'): Chainable<Array<string>> => {
  const regex = /[\\]/g;

  const splitCSVFile = str => str.split('\n')
    .map(row => row.replaceAll(regex, ''));

  if (fileType === 'responses') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-responses.csv`)
      .then(splitCSVFile);
  }
  if (fileType === 'reviews') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-reviews.csv`)
      .then(splitCSVFile);
  }
  return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-logs.csv`)
    .then(splitCSVFile);
};

export const convertResultsSeperatedArrays = (fileType: 'responses' | 'reviews' | 'logs'): Chainable<Array<Array<string>>> => {
  const splitCsvID = str => str.split('\n')
    .map(row => row.split(';').map(cell => cell.replace(/^"/, '').replace(/"$/, '')));

  if (fileType === 'responses') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-responses.csv`)
      .then(splitCsvID);
  }
  if (fileType === 'reviews') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-reviews.csv`)
      .then(splitCsvID);
  }
  throw new Error(`Unknown filetype: ${fileType}`);
};

export const getFromIframeAlt = (selector: string): Chainable<JQuery<HTMLElement>> => {
  cy.get('iframe')
    .its('0.contentDocument.body')
    .as('iframeBody')
    .should('be.visible');
  return cy.get('@iframeBody')
    .find(selector);
};

export const getFromIframe = (selector: string): Chainable<JQuery<HTMLElement>> => {
  cy.get(selector)
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap)
    .as('iframeBody')
  return cy.get('@iframeBody')
};


export const forwardTo = (expectedLabel: string) => {
  cy.get('[data-cy="unit-navigation-forward"]')
    .click();
  cy.get('[data-cy="unit-title"]')
    .contains(new RegExp(`^${expectedLabel}$`));
};

export const backwardsTo = (expectedLabel: string) => {
  cy.get('[data-cy="unit-navigation-backward"]')
    .click();
  cy.get('[data-cy="unit-title"]')
    .contains(new RegExp(`^${expectedLabel}$`));
};

export const gotoPage = (pageIndex: number) => {
  cy.get(`[data-cy="page-navigation-${pageIndex}"]`)
    .click();
  cy.get(`[data-cy="page-navigation-${pageIndex}"]`)
    .should('have.class', 'selected-value');
};

export const readBlockTime = (): Chainable=> {
  return cy.get('[data-cy="time-value"]')
    .invoke('text')
    .then(currTimeStr => {
      const currBlockTimeStr = currTimeStr.replace(/0:/, '');
      return +currBlockTimeStr;
    });
};

export const selectFromDropdown = (dropdownLabel: string, optionName: string) => {
  cy.contains('mat-form-field', dropdownLabel).find('mat-select').click();
  cy.get('.cdk-overlay-container').contains(optionName).click();
};

export const reload = () => cy.url()
  .then(url => cy.visit(url.includes('?testMode=true') ? url : `${url}?testMode=true`));

export const expectUnitMenuToBe = (expectations: string[]) => cy.get('[data-cy*="unit-nav-item"]')
  .each((item, index) => cy.wrap(item).should('have.attr', 'data-cy', `unit-nav-item:${expectations[index]}`));

